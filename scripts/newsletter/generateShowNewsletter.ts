#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { openai } from "../../lib/openai-client";
import {
  parseDateString, 
  formatDateForDisplay, 
  getCurrentNewsletterDateRange,
  getFutureShowsDateRange,
  isShowInDateRange,
  formatDateISO
} from "../../lib/date-utils";

dotenv.config({ path: ".env" });

// Use centralized date utilities for consistent formatting

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

  // Use UTC parsing to avoid timezone issues
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
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
    // Use UTC parsing for show dates to avoid timezone issues
    const showDate = parseDateString(show.date);
    
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
      (a, b) =>
        parseDateString(a.date).getTime() - parseDateString(b.date).getTime(),
    ),
    futureShows: futureShows.sort(
      (a, b) =>
        parseDateString(a.date).getTime() - parseDateString(b.date).getTime(),
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

async function extractCitiesFromAddresses(shows: any[]) {
  if (shows.length === 0) {
    return [];
  }

  // Filter out shows without valid addresses
  const showsWithAddresses = shows.filter(
    (show) =>
      show.address && show.address !== "N/A" && show.address.trim() !== "",
  );

  if (showsWithAddresses.length === 0) {
    return [];
  }

  try {
    const addressList = showsWithAddresses
      .map((show, index) => `${index + 1}. ${show.address}`)
      .join("\n");

    const prompt = `Extract the city names from these addresses. Return a JSON object with a "cities" array.

Addresses:
${addressList}

Examples:
- "123 Main St, Oakland, CA 94610" → "Oakland"
- "Wyldflowr Arts, 809 37th Street, Oakland, CA" → "Oakland"  
- "York Street Collective, San Francisco" → "San Francisco"
- "Private Castle Residence, Bordeaux, France" → "Bordeaux"

Return format: {"cities": ["City1", "City2", ...]}`;

    const response = await makeOpenAICallWithRetry(prompt, {
      response_format: { type: "json_object" },
      temperature: 0.1, // Lower temperature for more consistent extraction
    });

    if (response?.choices?.[0]?.message?.content) {
      const content = response.choices[0].message.content;
      // Try to parse as JSON object first, then extract array
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.filter((city: any) => city && typeof city === "string");
        } else if (parsed.cities && Array.isArray(parsed.cities)) {
          return parsed.cities.filter(
            (city: any) => city && typeof city === "string",
          );
        }
      } catch (parseError) {
        console.warn("🤖 Failed to parse city extraction JSON:", parseError);
      }
    }

    // Fallback: try regex extraction
    console.warn("🤖 AI city extraction failed, using regex fallback");
    const cities = new Set<string>();
    showsWithAddresses.forEach((show) => {
      const cityMatch = show.address.match(/([^,]+),\s*[A-Z]{2}/);
      if (cityMatch) {
        cities.add(cityMatch[1].trim());
      }
    });
    return Array.from(cities);
  } catch (error) {
    console.warn("🤖 City extraction failed, using regex fallback:", error);
    // Final fallback: regex extraction
    const cities = new Set<string>();
    showsWithAddresses.forEach((show) => {
      const cityMatch = show.address.match(/([^,]+),\s*[A-Z]{2}/);
      if (cityMatch) {
        cities.add(cityMatch[1].trim());
      }
    });
    return Array.from(cities);
  }
}

async function generateSpecificIntro(upcomingShows: any[], futureShows: any[]) {
  if (upcomingShows.length === 0) {
    return "While we don't have shows scheduled for the immediate future, we're working on some amazing performances. Stay tuned for updates on upcoming shows and special events!";
  }

  try {
    // Use AI to extract cities from addresses
    const extractedCities = await extractCitiesFromAddresses(upcomingShows);
    console.log(`🏙️ AI extracted cities: ${extractedCities.join(", ")}`);

    const showSummaries = upcomingShows.map((show) => {
      // Extract city from this specific show's address
      let city = "various locations";
      if (show.address && show.address !== "N/A") {
        // Try to match the extracted cities first
        const matchedCity = extractedCities.find((extractedCity: string) =>
          show.address.toLowerCase().includes(extractedCity.toLowerCase()),
        );
        if (matchedCity) {
          city = matchedCity;
        } else {
          // Fallback to regex extraction for this specific address
          const cityMatch = show.address.match(/([^,]+),\s*[A-Z]{2}/);
          if (cityMatch) {
            city = cityMatch[1].trim();
          } else {
            // For addresses like "Somewhere in South Bay", extract the location part
            city = show.address;
          }
        }
      }

  return {
        title: show.title,
        date: formatDate(show.date),
        venue: show.venue,
        type: show.title.includes("High Tide") ? "band" : "solo sitar",
        city: city,
      };
    });

    const cityList = extractedCities.join(", ");
    const locationContext =
      extractedCities.length > 0
        ? `around ${cityList}`
        : "in various locations";

    const prompt = `You're Sasha Bayan, a sitar player and musician. Write a casual, friendly intro for your weekly newsletter about upcoming shows.

Context: You have ${
      upcomingShows.length
    } show(s) coming up this week in ${locationContext}.

Show details:
${showSummaries
  .map(
    (s) => `- ${s.title} (${s.type}) on ${s.date} at ${s.venue} in ${s.city}`,
  )
  .join("\n")}

Requirements:
- Keep it casual and conversational, like you're talking to friends
- Mention the number of shows and give a brief sense of what's happening
- Reference the specific cities/locations (${cityList})
- Don't be overly formal or marketing-y
- Keep it under 3 sentences
- Sound natural and excited about your shows

Write just the intro text:`;

    const response = await makeOpenAICallWithRetry(prompt);
    if (response?.choices?.[0]?.message?.content) {
      return response.choices[0].message.content;
    }
    return "Got some shows coming up this week. Check them out below!";
  } catch (error) {
    console.warn("🤖 AI intro generation failed, using fallback:", error);
    // Fallback to simple intro - try AI city extraction first, then regex
    try {
      const extractedCities = await extractCitiesFromAddresses(upcomingShows);
      const locationContext =
        extractedCities.length > 0
          ? `around ${extractedCities.join(", ")}`
          : "in various locations";

      if (upcomingShows.length === 1) {
        const show = upcomingShows[0];
        const city = extractedCities[0] || "various locations";
        return `Got ${upcomingShows.length} show coming up this week. ${
          show.title
        } is happening ${formatDate(
          show.date,
        )} in ${city}. Check it out below!`;
      } else {
        return `Got ${upcomingShows.length} shows coming up this week. Mix of solo sitar and band stuff, ${locationContext}. Scroll down to see what's happening!`;
      }
    } catch (fallbackError) {
      console.warn("🤖 Fallback city extraction also failed:", fallbackError);
      return `Got ${upcomingShows.length} show${
        upcomingShows.length > 1 ? "s" : ""
      } coming up this week. Check out what's happening below!`;
    }
  }
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

// Use centralized date formatting utility
const formatDate = formatDateForDisplay;

async function generateDynamicSubject(upcomingShows: any[], themes: string[]) {
  if (upcomingShows.length === 0) {
    return "Sasha Bayan Shows: Stay Tuned for Updates";
  }

  // Filter out private events for subject line generation
  const publicShows = upcomingShows.filter(
    (show) =>
      !show.title.toLowerCase().includes("private") &&
      !show.venue.toLowerCase().includes("private") &&
      show.address !== "N/A",
  );

  // If no public shows, use a generic subject
  if (publicShows.length === 0) {
    return "Sasha Bayan Shows: This Week's Performances";
  }

  // Use AI to extract cities from public shows
  let extractedCities: string[] = [];
  try {
    extractedCities = await extractCitiesFromAddresses(publicShows);
    console.log(`🏙️ Subject line cities: ${extractedCities.join(", ")}`);
  } catch (error) {
    console.warn("🤖 City extraction failed for subject line:", error);
  }

  // Extract show types (only from public shows)
  const showTypes = new Set<string>();
  publicShows.forEach((show) => {
    if (show.title.includes("High Tide")) {
      showTypes.add("High Tide");
    } else if (show.title.includes("Solo Sitar")) {
      showTypes.add("Solo Sitar");
    } else {
      showTypes.add("Live Music");
    }
  });

  // Generate different subject line patterns
  const patterns = [
    // Pattern 1: Theme-based with city context
    () => {
      const cityList = extractedCities.slice(0, 2).join(" & ") || "Bay Area";
      const primaryTheme = themes[0] || "Live Music";
      return `Sasha Bayan: ${primaryTheme} in ${cityList}`;
    },

    // Pattern 2: Show count with type
    () => {
      const typeList = Array.from(showTypes).slice(0, 2).join(" + ");
      return `Sasha Bayan: ${publicShows.length} Shows - ${typeList}`;
    },

    // Pattern 3: Specific show highlight
    () => {
      const firstShow = publicShows[0];
      const city = extractedCities[0] || "Bay Area";
      return `Sasha Bayan: ${firstShow.title} in ${city}`;
    },

    // Pattern 4: Date-based with theme
    () => {
      const primaryTheme = themes[0] || "Live Music";
      const cityList = extractedCities.slice(0, 2).join(" & ") || "Bay Area";
      return `Sasha Bayan: This Week's ${primaryTheme} in ${cityList}`;
    },
  ];

  // Randomly select a pattern for variety
  const randomIndex = Math.floor(Math.random() * patterns.length);
  return patterns[randomIndex]();
}

export { generateDynamicSubject };
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

  // Generate content with AI-powered intro
  const themes = generateSpecificThemes(upcomingShows);
  const intro = await generateSpecificIntro(upcomingShows, futureShows);

  const newsletter = {
    id: newsletterId,
    generatedAt: new Date().toISOString(),
    dateRange: { start: startDate, end: endDate },
    intro,
    themes,
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
