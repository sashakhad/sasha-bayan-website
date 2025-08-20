import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as React from "react";
import ShowNewsletterEmail from "../../../components/emails/ShowNewsletterEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;
export const preferredRegion = ["iad1"];

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
  
  // Get end of current week (Sunday)
  const endOfCurrentWeek = new Date(now);
  const daysUntilSunday = 7 - now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  endOfCurrentWeek.setDate(now.getDate() + daysUntilSunday);
  
  // Get end of next week (Sunday of next week)
  const endOfNextWeek = new Date(endOfCurrentWeek);
  endOfNextWeek.setDate(endOfCurrentWeek.getDate() + 7);
  
  console.log(
    `📅 Newsletter covers: ${now.toISOString().split("T")[0]} to ${endOfNextWeek.toISOString().split("T")[0]} (current + next week)`
  );
  
  return {
    start: now.toISOString().split("T")[0],
    end: endOfNextWeek.toISOString().split("T")[0],
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requiredEnvVars = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required environment variables",
          missing: missingVars,
          details:
            "Please configure all required environment variables in Vercel project settings",
        },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const testMode = url.searchParams.get("test") === "true";

    const dateRange = getDateRange(testMode);
    const newsletterId = `${dateRange.start}-to-${dateRange.end}`;

    console.log(
      `Cron job triggered for show newsletter: ${newsletterId}${testMode ? " (TEST MODE)" : ""}`
    );

    console.log(`Starting newsletter generation for ${newsletterId}`);

    const { generateShowNewsletter } = await import(
      "../../../../scripts/newsletter/generateShowNewsletter"
    );

    const generationStart = Date.now();
    const newsletter = await generateShowNewsletter(
      dateRange.start,
      dateRange.end,
      testMode
    );
    const generationTime = Date.now() - generationStart;

    if (!newsletter) {
      console.log("No upcoming shows found, skipping newsletter send");
      return NextResponse.json({
        success: true,
        message: "No upcoming shows, newsletter not sent",
        newsletterId,
        generationTime,
      });
    }

    console.log(`Newsletter generation completed in ${generationTime}ms`);

    if (!newsletter.upcomingShows || newsletter.upcomingShows.length === 0) {
      return NextResponse.json(
        { error: "Newsletter has no shows - refusing to send" },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY!);
    const fromEmail =
      process.env.NEWSLETTER_FROM_EMAIL || "shows@sashabayan.com";
    const fromName = "Sasha Bayan Shows";

    const subject =
      newsletter.themes && newsletter.themes.length > 0
        ? `Sasha Bayan Shows: ${newsletter.themes.join(", ")}`
        : newsletter.dateRange
          ? `Sasha Bayan Shows - ${newsletter.dateRange.start} to ${newsletter.dateRange.end}`
          : `Sasha Bayan Shows - ${newsletter.id}`;

    const emailReact = React.createElement(ShowNewsletterEmail, {
      newsletter: newsletter,
    });

    const audienceId = process.env.RESEND_AUDIENCE_ID!;
    if (!audienceId) {
      return NextResponse.json(
        { error: "RESEND_AUDIENCE_ID not configured" },
        { status: 500 }
      );
    }

    const broadcastResponse = await resend.broadcasts.create({
      audienceId,
      from: `${fromName} <${fromEmail}>`,
      subject,
      name: `${subject} (${newsletter.dateRange.start} to ${newsletter.dateRange.end})`,
      react: emailReact,
    });

    if (!broadcastResponse.data?.id) {
      return NextResponse.json(
        {
          error: `Broadcast creation failed`,
          details: broadcastResponse.error,
        },
        { status: 500 }
      );
    }

    await resend.broadcasts.send(broadcastResponse.data.id);

    return NextResponse.json({
      success: true,
      message: "Show newsletter generated and sent successfully",
      newsletterId,
      broadcastId: broadcastResponse.data.id,
      generationTime,
      showsCount: newsletter.upcomingShows.length,
      futureShowsCount: newsletter.futureShows?.length || 0,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
