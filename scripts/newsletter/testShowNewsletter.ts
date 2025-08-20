#!/usr/bin/env node

import dotenv from "dotenv";
import { generateShowNewsletter } from "./generateShowNewsletter";

dotenv.config({ path: ".env.local" });

function getTestDateRange() {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
  
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  
  return {
    start: nextMonday.toISOString().split("T")[0],
    end: nextSunday.toISOString().split("T")[0],
  };
}

async function testNewsletter() {
  console.log("🧪 Testing show newsletter generation...");
  console.log("═".repeat(50));
  
  try {
    const dateRange = getTestDateRange();
    console.log(`📅 Testing date range: ${dateRange.start} to ${dateRange.end}`);
    
    const newsletter = await generateShowNewsletter(
      dateRange.start,
      dateRange.end,
      true, // force regenerate
      true  // test mode
    );
    
    if (newsletter) {
      console.log("\n✅ Newsletter generated successfully!");
      console.log(`📰 Newsletter ID: ${newsletter.id}`);
      console.log(`🎵 Upcoming shows: ${newsletter.upcomingShows.length}`);
      console.log(`🔮 Future shows: ${newsletter.futureShows?.length || 0}`);
      console.log(`🎨 Themes: ${newsletter.themes.join(", ")}`);
      console.log(`📝 Intro preview: ${newsletter.intro.substring(0, 100)}...`);
      
      if (newsletter.upcomingShows.length > 0) {
        console.log("\n🎵 Upcoming Shows:");
        newsletter.upcomingShows.forEach((show, index) => {
          console.log(`  ${index + 1}. ${show.title} at ${show.venue} (${show.date})`);
        });
      }
      
      if (newsletter.futureShows && newsletter.futureShows.length > 0) {
        console.log("\n🔮 Future Shows:");
        newsletter.futureShows.forEach((show, index) => {
          console.log(`  ${index + 1}. ${show.title} at ${show.venue} (${show.date})`);
        });
      }
    } else {
      console.log("📭 No newsletter generated (no upcoming shows found)");
    }
    
    console.log("\n🎉 Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testNewsletter();
