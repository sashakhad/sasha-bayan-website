#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { openai } from "../../lib/openai-client";

dotenv.config({ path: ".env" });

function getDateRange(testMode = false) {
  if (testMode) {
    const now = new Date();
    const randomDate = new Date(
      now.getTime() + Math.random() * (30 * 24 * 60 * 60 * 1000),
    );

    const dayOfWeek = randomDate.getDay();
    const monday = new Date(randomDate);
    monday.setDate(randomDate.getDate() - dayOfWeek + 1);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    console.log(
      `🎲 Test mode: Generated random week ${
        monday.toISOString().split("T")[0]
      } to ${sunday.toISOString().split("T")[0]}`,
    );

    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  }

  const now = new Date();

  // Get end of current week (Sunday)
  const endOfCurrentWeek = new Date(now);
  const daysUntilSunday = 7 - now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  endOfCurrentWeek.setDate(now.getDate() + daysUntilSunday);

  // Get end of next week (Sunday of next week)
  const endOfNextWeek = new Date(endOfCurrentWeek);
  endOfNextWeek.setDate(endOfCurrentWeek.getDate() + 7);

  console.log(
    `📅 Newsletter covers: ${now.toISOString().split("T")[0]} to ${
      endOfNextWeek.toISOString().split("T")[0]
    } (current + next week)`,
  );

  return {
    start: now.toISOString().split("T")[0],
    end: endOfNextWeek.toISOString().split("T")[0],
  };
}

function getShowsForDateRange(startDate: string, endDate: string) {
  const showsPath = path.join(process.cwd(), "app", "shows", "data.ts");

  if (!fs.existsSync(showsPath)) {
    console.error("❌ Shows data file not found at:", showsPath);
    return { upcomingShows: [], futureShows: [] };
  }

  const showsContent = fs.readFileSync(showsPath, "utf8");

  const showsMatch = showsContent.match(/export const shows = (\[[\s\S]*?\]);/);
  if (!showsMatch) {
    console.error("❌ Could not parse shows data from file");
    return { upcomingShows: [], futureShows: [] };
  }

  let shows;
  try {
    shows = eval(showsMatch[1]);
  } catch (error) {
    console.error("❌ Error parsing shows data:", error);
    return { upcomingShows: [], futureShows: [] };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const futureStart = new Date(end);
  futureStart.setDate(end.getDate() + 1);
  const futureEnd = new Date(futureStart);
  futureEnd.setMonth(futureEnd.getMonth() + 3);

  console.log(`🔍 Looking for shows from ${startDate} to ${endDate}`);
  console.log(
    `🔮 Looking for future shows from ${
      futureStart.toISOString().split("T")[0]
    } to ${futureEnd.toISOString().split("T")[0]}`,
  );

  const upcomingShows: any[] = [];
  const futureShows: any[] = [];

  for (const show of shows) {
    const showDate = new Date(show.date);

    if (showDate >= start && showDate <= end) {
      upcomingShows.push(show);
      console.log(`✅ Found upcoming show: ${show.title} (${show.date})`);
    } else if (showDate > end && showDate <= futureEnd) {
      futureShows.push({
        title: show.title,
        date: show.date,
        venue: show.venue,
        venueLink: show.venueLink,
        address: show.address,
        startTime: show.startTime,
        endTime: show.endTime,
        ticketLink: show.ticketLink,
        note: show.note,
        description: show.description,
        bandWebsite: show.bandWebsite,
      });
      console.log(`🔮 Found future show: ${show.title} (${show.date})`);
    }
  }

  console.log(`📊 Total upcoming shows: ${upcomingShows.length}`);
  console.log(`📊 Total future shows: ${futureShows.length}`);

  return {
    upcomingShows: upcomingShows.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    ),
    futureShows: futureShows.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    ),
  };
}

async function makeOpenAICallWithRetry(
  messages: any,
  options: any = {},
  maxRetries = 3,
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 OpenAI call attempt ${attempt}/${maxRetries}`);
      return await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.7,
        response_format: { type: "text" },
        ...options,
        messages: Array.isArray(messages)
          ? messages
          : [{ role: "user", content: messages }],
      });
    } catch (error: any) {
      console.error(`❌ OpenAI call attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw new Error(
          `OpenAI call failed after ${maxRetries} attempts: ${error.message}`,
        );
      }

      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function generateSpecificIntro(upcomingShows: any[], futureShows: any[]) {
  if (upcomingShows.length === 0) {
    return "While we don't have shows scheduled for the immediate future, we're working on some amazing performances. Stay tuned for updates on upcoming shows and special events!";
  }

  // Get unique venues and show types
  const venues = Array.from(new Set(upcomingShows.map((show) => show.venue)));
  const hasPrivateEvents = upcomingShows.some(
    (show) =>
      show.venue.toLowerCase().includes("private") ||
      show.venue.toLowerCase().includes("residence"),
  );
  const hasPublicVenues = upcomingShows.some(
    (show) =>
      !show.venue.toLowerCase().includes("private") &&
      !show.venue.toLowerCase().includes("residence"),
  );
  const hasWellnessEvents = upcomingShows.some(
    (show) =>
      show.description?.toLowerCase().includes("wellness") ||
      show.description?.toLowerCase().includes("cacao") ||
      show.description?.toLowerCase().includes("yoga"),
  );

  let intro = "";

  if (upcomingShows.length === 1) {
    const show = upcomingShows[0];
    intro = `Hey music lovers,\n\nGot ${
      upcomingShows.length
    } show coming up this week. ${show.title} is happening ${formatDate(
      show.date,
    )}. Check it out below!`;
  } else {
    intro = `Hey music lovers,\n\nGot ${upcomingShows.length} shows coming up this week. Mix of solo sitar and band stuff, mostly around California. Scroll down to see what's happening!`;
  }

  return intro;
}

function generateSpecificThemes(upcomingShows: any[]) {
  if (upcomingShows.length === 0) {
    return ["Coming Soon", "Stay Tuned", "Future Performances"];
  }

  const themes = new Set<string>();

  // Add themes based on show content
  upcomingShows.forEach((show) => {
    if (show.description?.toLowerCase().includes("sitar")) {
      themes.add("Sitar Performance");
    }
    if (
      show.description?.toLowerCase().includes("wellness") ||
      show.description?.toLowerCase().includes("cacao") ||
      show.description?.toLowerCase().includes("yoga")
    ) {
      themes.add("Wellness & Music");
    }
    if (
      show.description?.toLowerCase().includes("private") ||
      show.venue.toLowerCase().includes("private")
    ) {
      themes.add("Private Events");
    }
    if (
      show.description?.toLowerCase().includes("world music") ||
      show.description?.toLowerCase().includes("fusion")
    ) {
      themes.add("World Music Fusion");
    }
    if (
      show.description?.toLowerCase().includes("improvisation") ||
      show.description?.toLowerCase().includes("jam")
    ) {
      themes.add("Live Improvisation");
    }
  });

  // If no specific themes found, add defaults
  if (themes.size === 0) {
    themes.add("Live Music");
    themes.add("Sitar Performance");
  }

  // Ensure we have 2-3 themes
  const themeArray = Array.from(themes);
  if (themeArray.length === 1) {
    themeArray.push("Live Performance");
  }
  if (themeArray.length > 3) {
    return themeArray.slice(0, 3);
  }

  return themeArray;
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}

export async function generateShowNewsletter(
  startDate: string,
  endDate: string,
  testMode = false,
) {
  const newsletterId = `${startDate}-to-${endDate}`;

  console.log(`📰 Generating show newsletter: ${newsletterId}`);
  console.log(`📅 Date range: ${startDate} to ${endDate}`);
  console.log(`🧪 Test mode: ${testMode}`);

  const { upcomingShows, futureShows } = getShowsForDateRange(
    startDate,
    endDate,
  );

  if (upcomingShows.length === 0) {
    console.log("📭 No upcoming shows found, not generating newsletter");
    return null;
  }

  // Generate content directly (no OpenAI calls for now - using our smart functions)
  const content = {
    themes: generateSpecificThemes(upcomingShows),
    intro: generateSpecificIntro(upcomingShows, futureShows),
  };

  const newsletter = {
    id: newsletterId,
    generatedAt: new Date().toISOString(),
    dateRange: { start: startDate, end: endDate },
    intro: content.intro,
    themes: content.themes,
    upcomingShows,
    futureShows: futureShows.slice(0, 5),
  };

  console.log(`✅ Newsletter generated successfully: ${newsletterId}`);
  return newsletter;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const testMode = args.includes("--test");

  const dateRange = getDateRange(testMode);

  generateShowNewsletter(dateRange.start, dateRange.end, testMode)
    .then((newsletter) => {
      if (newsletter) {
        console.log("🎉 Newsletter generation completed successfully!");
        console.log(`📰 Newsletter ID: ${newsletter.id}`);
        console.log(`🎵 Upcoming shows: ${newsletter.upcomingShows.length}`);
        console.log(`🔮 Future shows: ${newsletter.futureShows?.length || 0}`);
        console.log(`🎨 Themes: ${newsletter.themes.join(", ")}`);
        console.log(
          `📝 Intro preview: ${newsletter.intro.substring(0, 100)}...`,
        );
      } else {
        console.log("📭 No newsletter generated (no upcoming shows)");
      }
    })
    .catch((error) => {
      console.error("❌ Newsletter generation failed:", error);
      process.exit(1);
    });
}
