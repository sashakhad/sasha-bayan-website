#!/usr/bin/env node

import dotenv from "dotenv";
import { Resend } from "resend";
import * as React from "react";
import ShowNewsletterEmail from "../../app/components/emails/ShowNewsletterEmail";

// Load from .env file
dotenv.config({ path: ".env" });

async function testEmailSending() {
  console.log("🧪 Testing email sending functionality...");
  console.log("═".repeat(50));

  // Check required environment variables
  const requiredEnvVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEWSLETTER_FROM_EMAIL: process.env.NEWSLETTER_FROM_EMAIL,
    // Test email recipient (you can change this to your email)
    TEST_EMAIL: process.env.TEST_EMAIL || "your-email@example.com",
    // Redis variables (optional - will fallback to filesystem)
    KV_URL: process.env.KV_URL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN,
    REDIS_URL: process.env.REDIS_URL,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\nPlease set these in your .env or .env.local file");
    process.exit(1);
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const fromEmail =
      process.env.NEWSLETTER_FROM_EMAIL || "shows@sashabayan.com";
    const fromName = "Sasha Bayan Shows";

    // Create a test newsletter object
    const testNewsletter = {
      id: "test-newsletter",
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: "2024-01-15",
        end: "2024-01-21",
      },
      sentAt: null,
      intro:
        "This is a test newsletter to verify that the email sending functionality is working correctly. We're excited to share upcoming shows with you!",
      themes: ["Jazz", "Experimental", "Live Performance"],
      upcomingShows: [
        {
          title: "Test Show 1",
          date: "2024-01-16",
          venue: "Test Venue 1",
          address: "123 Test St, Test City",
          startTime: "8:00 PM",
          endTime: "10:00 PM",
          ticketLink: "https://example.com/tickets",
          note: "Test note",
          description: "This is a test show description",
        },
        {
          title: "Test Show 2",
          date: "2024-01-18",
          venue: "Test Venue 2",
          address: "456 Test Ave, Test City",
          startTime: "7:30 PM",
          endTime: "9:30 PM",
          ticketLink: "https://example.com/tickets2",
          note: "Another test note",
          description: "This is another test show description",
        },
      ],
      futureShows: [
        {
          title: "Future Test Show",
          date: "2024-02-01",
          venue: "Future Test Venue",
          address: "789 Future St, Test City",
          startTime: "8:00 PM",
          endTime: "10:00 PM",
          ticketLink: "https://example.com/future",
          note: "Future test note",
          description: "This is a future test show description",
        },
      ],
    };

    const subject = `Test Newsletter: ${testNewsletter.themes.join(", ")}`;

    console.log(`📧 Sending test email...`);
    console.log(`📤 From: ${fromName} <${fromEmail}>`);
    console.log(`📋 Subject: ${subject}`);
    console.log(`🎵 Shows included: ${testNewsletter.upcomingShows.length}`);

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

    console.log("✅ Test email sent successfully!");
    console.log(`📧 Email ID: ${emailResponse.data?.id}`);
    console.log(`📬 Sent to: ${testEmail}`);
    console.log(`📧 Check your email inbox for the test newsletter`);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testEmailSending();
