#!/usr/bin/env node

import dotenv from "dotenv";
import { Resend } from "resend";
import * as React from "react";
import { shows } from "../../app/shows/data";
import ShowNewsletterEmail from "../../app/components/emails/ShowNewsletterEmail";
import { generateDynamicSubject } from "./generateShowNewsletter";
import { parseDateString } from "../../lib/date-utils";

dotenv.config({ path: ".env" });

// Use centralized date utilities for consistent formatting

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
    // Use UTC parsing to avoid timezone issues, then format for PST display
    const date = parseDateString(dateString);

    // Format the date in PST timezone
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles", // Explicitly use PST/PDT
    });
  } catch (error) {
    return dateString;
  }
}

async function testRealDataEmail() {
  console.log("🧪 Testing email with REAL show data...");
  console.log("═".repeat(50));

  // Check required environment variables
  const requiredEnvVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEWSLETTER_FROM_EMAIL: process.env.NEWSLETTER_FROM_EMAIL,
    // Test email recipient (you can change this to your email)
    TEST_EMAIL: process.env.TEST_EMAIL || "your-email@example.com",
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\nPlease set these in your .env file");
    process.exit(1);
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const fromEmail =
      process.env.NEWSLETTER_FROM_EMAIL || "shows@sashabayan.com";
    const fromName = "Sasha Bayan Shows";

    // Import real shows data
    const { shows } = await import("../../app/shows/data");

    // Get current date and find shows for current week + next week
    const now = new Date();

    // Get end of current week (Sunday)
    const endOfCurrentWeek = new Date(now);
    const daysUntilSunday = 7 - now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    endOfCurrentWeek.setDate(now.getDate() + daysUntilSunday);

    // Get end of next week (Sunday of next week)
    const endOfNextWeek = new Date(endOfCurrentWeek);
    endOfNextWeek.setDate(endOfCurrentWeek.getDate() + 7);

    // Filter shows for current week + next week
    const upcomingShows = shows
      .filter((show) => {
        const showDate = parseDateString(show.date);
        return showDate >= now && showDate <= endOfNextWeek;
      })
      .sort(
        (a, b) =>
          parseDateString(a.date).getTime() - parseDateString(b.date).getTime(),
      );

    // Filter shows for the next 3 months (future shows)
    const futureShows = shows
      .filter((show) => {
        const showDate = parseDateString(show.date);
        return (
          showDate > endOfNextWeek &&
          showDate <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        );
      })
      .sort(
        (a, b) =>
          parseDateString(a.date).getTime() - parseDateString(b.date).getTime(),
      )
      .slice(0, 5); // Limit to 5 future shows

    console.log(
      `📅 Found ${upcomingShows.length} upcoming shows for current + next week`,
    );
    console.log(
      `🔮 Found ${futureShows.length} future shows for next 3 months`,
    );

    if (upcomingShows.length === 0) {
      console.log(
        "⚠️ No upcoming shows found for current + next week. Looking further ahead...",
      );

      // Find the next available week with shows
      let weekOffset = 1;
      let foundShows: any[] = [];

      while (weekOffset <= 8 && foundShows.length === 0) {
        const startDate = new Date(now);
        startDate.setDate(now.getDate() + weekOffset * 7);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        foundShows = shows.filter((show) => {
          const showDate = parseDateString(show.date);
          return showDate >= startDate && showDate <= endDate;
        });

        weekOffset++;
      }

      if (foundShows.length > 0) {
        upcomingShows.push(...foundShows.slice(0, 3));
        console.log(
          `✅ Using shows from week ${weekOffset}: ${upcomingShows.length} shows`,
        );
      }
    }

    // Create newsletter with real data
    // Import the AI-powered intro generation from the main script
    const { generateShowNewsletter } = await import("./generateShowNewsletter");

    // Generate a proper newsletter with AI intro
    const fullNewsletter = await generateShowNewsletter(
      now.toISOString().split("T")[0], // Start date
      endOfNextWeek.toISOString().split("T")[0], // End date
      false, // Not test mode
    );

    const testNewsletter = fullNewsletter || {
      id: "real-data-test",
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: now.toISOString().split("T")[0],
        end: endOfNextWeek.toISOString().split("T")[0],
      },
      sentAt: null,
      intro: "Got some shows coming up this week. Check them out below!",
      themes: generateSpecificThemes(upcomingShows),
      upcomingShows: upcomingShows.length > 0 ? upcomingShows : [],
      futureShows: futureShows,
    };

    const subject = await generateDynamicSubject(
      upcomingShows,
      testNewsletter.themes,
    );

    console.log(`📧 Sending test email with REAL data...`);
    console.log(`📤 From: ${fromName} <${fromEmail}>`);
    console.log(`📋 Subject: ${subject}`);
    console.log(`🎵 Upcoming shows: ${upcomingShows.length}`);
    console.log(`🔮 Future shows: ${futureShows.length}`);

    if (upcomingShows.length > 0) {
      console.log("\n🎵 Upcoming Shows:");
      upcomingShows.forEach((show, index) => {
        console.log(
          `  ${index + 1}. ${show.title} at ${show.venue} (${show.date})`,
        );
      });
    }

    if (futureShows.length > 0) {
      console.log("\n🔮 Future Shows:");
      futureShows.forEach((show, index) => {
        console.log(
          `  ${index + 1}. ${show.title} at ${show.venue} (${show.date})`,
        );
      });
    }

    const testEmail = process.env.TEST_EMAIL || "your-email@example.com";

    const emailReact = React.createElement(ShowNewsletterEmail, {
      newsletter: testNewsletter,
      recipientEmail: testEmail,
    });

    // Send single email (not broadcast)
    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [testEmail],
      subject,
      react: emailReact,
    });

    if (emailResponse.error) {
      throw new Error(
        `Email send failed: ${JSON.stringify(emailResponse.error)}`,
      );
    }

    console.log("\n✅ Test email with REAL data sent successfully!");
    console.log(`📧 Email ID: ${emailResponse.data?.id}`);
    console.log(`📬 Sent to: ${testEmail}`);
    console.log(
      `📧 Check your email inbox for the newsletter with real show data`,
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testRealDataEmail();
