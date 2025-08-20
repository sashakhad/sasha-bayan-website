#!/usr/bin/env node

import dotenv from "dotenv";
import { Resend } from "resend";
import * as React from "react";
import ShowNewsletterEmail from "../../app/components/emails/ShowNewsletterEmail";

dotenv.config({ path: ".env" });

function generateSpecificIntro(upcomingShows: any[], futureShows: any[]) {
  if (upcomingShows.length === 0) {
    return "While we don't have shows scheduled for the immediate future, we're working on some amazing performances. Stay tuned for updates on upcoming shows and special events!";
  }

  // Get unique venues and show types
  const venues = [...new Set(upcomingShows.map((show) => show.venue))];
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
    if (show.venue.toLowerCase().includes("private")) {
      intro = `We have a special private event coming up! ${
        show.title
      } is happening ${formatDate(
        show.date,
      )} at a private location. This intimate gathering promises to be a unique musical experience.`;
    } else if (show.description?.toLowerCase().includes("wellness")) {
      intro = `Join us for a wellness-focused musical experience! ${
        show.title
      } combines healing sounds with wellness practices on ${formatDate(
        show.date,
      )} at ${
        show.venue
      }. This is perfect for anyone looking to nourish both body and soul.`;
    } else {
      intro = `Don't miss our upcoming performance! ${
        show.title
      } is happening ${formatDate(show.date)} at ${show.venue}. ${
        show.description
          ? show.description.substring(0, 100) + "..."
          : "This promises to be an incredible evening of music and connection."
      }`;
    }
  } else {
    intro = `We have ${upcomingShows.length} exciting shows coming up this week! `;

    if (hasWellnessEvents && hasPublicVenues) {
      intro +=
        "From wellness-focused experiences to public performances, there's something for every mood and preference. ";
    } else if (hasWellnessEvents) {
      intro +=
        "These wellness-focused events combine healing practices with live music for a truly transformative experience. ";
    } else if (hasPrivateEvents && hasPublicVenues) {
      intro +=
        "We're mixing intimate private gatherings with public performances, offering both exclusive and accessible musical experiences. ";
    } else if (hasPrivateEvents) {
      intro +=
        "These intimate private gatherings offer exclusive access to our music in personal, curated settings. ";
    } else {
      intro +=
        "Each performance offers a unique blend of sitar, world music, and improvisation. ";
    }

    intro +=
      "Check out the details below and join us for these special moments!";
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
        const showDate = new Date(show.date);
        return showDate >= now && showDate <= endOfNextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter shows for the next 3 months (future shows)
    const futureShows = shows
      .filter((show) => {
        const showDate = new Date(show.date);
        return (
          showDate > endOfNextWeek &&
          showDate <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
      let foundShows = [];

      while (weekOffset <= 8 && foundShows.length === 0) {
        const startDate = new Date(now);
        startDate.setDate(now.getDate() + weekOffset * 7);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        foundShows = shows.filter((show) => {
          const showDate = new Date(show.date);
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
    const testNewsletter = {
      id: "real-data-test",
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: now.toISOString().split("T")[0],
        end: endOfNextWeek.toISOString().split("T")[0],
      },
      sentAt: null,
      intro: generateSpecificIntro(upcomingShows, futureShows),
      themes: generateSpecificThemes(upcomingShows),
      upcomingShows: upcomingShows.length > 0 ? upcomingShows : [],
      futureShows: futureShows,
    };

    const subject =
      upcomingShows.length > 0
        ? `Sasha Bayan Shows: ${upcomingShows.length} Upcoming Performance${
            upcomingShows.length > 1 ? "s" : ""
          }`
        : "Sasha Bayan Shows: Stay Tuned for Updates";

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

    const emailReact = React.createElement(ShowNewsletterEmail, {
      newsletter: testNewsletter,
    });

    const testEmail = process.env.TEST_EMAIL || "your-email@example.com";

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
