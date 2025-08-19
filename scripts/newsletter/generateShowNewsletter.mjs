#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { openai } from "../../lib/openai-client";
import {
  loadShowNewsletter,
  saveShowNewsletter,
  showNewsletterExists,
  loadShowTracking,
  saveShowTracking,
  addNewsletterToCounter,
} from "../../lib/redis-storage";

dotenv.config({ path: ".env.local" });

function getDateRange(testMode = false) {
  if (testMode) {
    const now = new Date();
    const randomDate = new Date(
      now.getTime() + Math.random() * (30 * 24 * 60 * 60 * 1000)
    );
    
    const dayOfWeek = randomDate.getDay();
    const monday = new Date(randomDate);
    monday.setDate(randomDate.getDate() - dayOfWeek + 1);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    console.log(
      `🎲 Test mode: Generated random week ${monday.toISOString().split("T")[0]} to ${sunday.toISOString().split("T")[0]}`
    );
    
    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);
  
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  
  return {
    start: nextMonday.toISOString().split("T")[0],
    end: nextSunday.toISOString().split("T")[0],
  };
}

function getShowsForDateRange(startDate, endDate) {
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
  console.log(`🔮 Looking for future shows from ${futureStart.toISOString().split("T")[0]} to ${futureEnd.toISOString().split("T")[0]}`);

  const upcomingShows = [];
  const futureShows = [];

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
        address: show.address,
        startTime: show.startTime,
        endTime: show.endTime,
        ticketLink: show.ticketLink,
        note: show.note,
        description: show.description,
      });
      console.log(`🔮 Found future show: ${show.title} (${show.date})`);
    }
  }

  console.log(`📊 Total upcoming shows: ${upcomingShows.length}`);
  console.log(`📊 Total future shows: ${futureShows.length}`);
  
  return {
    upcomingShows: upcomingShows.sort((a, b) => new Date(a.date) - new Date(b.date)),
    futureShows: futureShows.sort((a, b) => new Date(a.date) - new Date(b.date)),
  };
}

async function makeOpenAICallWithRetry(messages, options = {}, maxRetries = 3) {
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
    } catch (error) {
      console.error(`❌ OpenAI call attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw new Error(
          `OpenAI call failed after ${maxRetries} attempts: ${error.message}`
        );
      }

      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function generateNewsletterContent(upcomingShows, futureShows, dateRange) {
  if (upcomingShows.length === 0) {
    console.log("📭 No upcoming shows, skipping content generation");
    return null;
  }

  const showsText = upcomingShows
    .map(
      (show) =>
        `${show.title} at ${show.venue} on ${show.date} (${show.startTime} - ${show.endTime})`
    )
    .join("\n");

  const futureShowsText = futureShows
    .slice(0, 5)
    .map((show) => `${show.title} at ${show.venue} on ${show.date}`)
    .join("\n");

  const themesPrompt = `Based on these upcoming shows, identify 2-3 key themes or categories that describe the types of performances. Be concise and use 2-4 words per theme.

Upcoming shows:
${showsText}

Return only the themes separated by commas, no other text.`;

  const themesResponse = await makeOpenAICallWithRetry(themesPrompt);
  const themes = themesResponse.choices[0].message.content
    .split(",")
    .map((theme) => theme.trim())
    .filter((theme) => theme.length > 0);

  const introPrompt = `Write a warm, engaging introduction for a weekly newsletter about upcoming music shows. The tone should be friendly and enthusiastic, like talking to friends about exciting events coming up.

Upcoming shows this week:
${showsText}

${futureShows.length > 0 ? `Future shows to look forward to:\n${futureShowsText}` : ""}

Write 2-3 paragraphs that:
1. Greet the readers warmly
2. Highlight the exciting shows coming up this week
3. Build anticipation for the performances
4. Keep it conversational and engaging

Do not include a greeting like "Hey friends" - that will be added automatically.`;

  const introResponse = await makeOpenAICallWithRetry(introPrompt);
  const intro = introResponse.choices[0].message.content.trim();

  return {
    themes,
    intro,
  };
}

export async function generateShowNewsletter(
  startDate,
  endDate,
  forceRegenerate = false,
  testMode = false
) {
  const newsletterId = `${startDate}-to-${endDate}`;
  
  console.log(`📰 Generating show newsletter: ${newsletterId}`);
  console.log(`📅 Date range: ${startDate} to ${endDate}`);
  console.log(`🔄 Force regenerate: ${forceRegenerate}`);
  console.log(`🧪 Test mode: ${testMode}`);

  if (!forceRegenerate && (await showNewsletterExists(newsletterId))) {
    console.log(`📰 Newsletter ${newsletterId} already exists, skipping generation`);
    return await loadShowNewsletter(newsletterId);
  }

  const { upcomingShows, futureShows } = getShowsForDateRange(startDate, endDate);

  if (upcomingShows.length === 0) {
    console.log("📭 No upcoming shows found, not generating newsletter");
    return null;
  }

  const content = await generateNewsletterContent(upcomingShows, futureShows, {
    start: startDate,
    end: endDate,
  });

  if (!content) {
    console.log("❌ Failed to generate newsletter content");
    return null;
  }

  const newsletter = {
    id: newsletterId,
    generatedAt: new Date().toISOString(),
    dateRange: { start: startDate, end: endDate },
    sentAt: null,
    intro: content.intro,
    themes: content.themes,
    upcomingShows,
    futureShows: futureShows.slice(0, 5),
  };

  await saveShowNewsletter(newsletterId, newsletter);
  await addNewsletterToCounter(newsletterId, testMode);

  console.log(`✅ Newsletter generated successfully: ${newsletterId}`);
  return newsletter;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const testMode = args.includes("--test");
  const forceRegenerate = args.includes("--force");
  
  const dateRange = getDateRange(testMode);
  
  try {
    const newsletter = await generateShowNewsletter(
      dateRange.start,
      dateRange.end,
      forceRegenerate,
      testMode
    );
    
    if (newsletter) {
      console.log("🎉 Newsletter generation completed successfully!");
      console.log(`📰 Newsletter ID: ${newsletter.id}`);
      console.log(`🎵 Upcoming shows: ${newsletter.upcomingShows.length}`);
      console.log(`🔮 Future shows: ${newsletter.futureShows?.length || 0}`);
    } else {
      console.log("📭 No newsletter generated (no upcoming shows)");
    }
  } catch (error) {
    console.error("❌ Newsletter generation failed:", error);
    process.exit(1);
  }
}
