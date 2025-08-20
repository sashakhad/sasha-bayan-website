import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as React from "react";
import ShowNewsletterEmail from "../../../components/emails/ShowNewsletterEmail";
import {
  loadShowNewsletter,
  saveShowNewsletter,
  showNewsletterExists,
} from "../../../../lib/redis-storage";

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

async function getNewsletter(newsletterId: string) {
  try {
    return await loadShowNewsletter(newsletterId);
  } catch (error) {
    return null;
  }
}

async function saveNewsletterData(newsletter: any): Promise<void> {
  await saveShowNewsletter(newsletter.id, newsletter);
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
    const forceRegenerate = url.searchParams.get("force") === "true";

    const dateRange = getDateRange(testMode);
    const newsletterId = `${dateRange.start}-to-${dateRange.end}`;

    console.log(
      `Cron job triggered for show newsletter: ${newsletterId}${forceRegenerate ? " (FORCE MODE)" : ""}${testMode ? " (TEST MODE)" : ""}`
    );

    const existingNewsletter = await getNewsletter(newsletterId);
    if (existingNewsletter && existingNewsletter.sentAt && !forceRegenerate) {
      console.log(
        `Newsletter ${newsletterId} already sent at ${existingNewsletter.sentAt}`
      );
      return NextResponse.json({
        success: true,
        message: "Newsletter already sent",
        newsletterId,
        sentAt: existingNewsletter.sentAt,
      });
    }

    if (forceRegenerate && existingNewsletter) {
      console.log(`Force regenerating newsletter: ${newsletterId}`);
    }

    console.log(`Starting direct newsletter generation for ${newsletterId}`);

    const { generateShowNewsletter } = await import(
      "../../../../scripts/newsletter/generateShowNewsletter"
    );

    const generationStart = Date.now();
    const newsletter = await generateShowNewsletter(
      dateRange.start,
      dateRange.end,
      forceRegenerate,
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

    const finalNewsletter = await getNewsletter(newsletterId);
    if (!finalNewsletter) {
      return NextResponse.json(
        { error: "Failed to retrieve generated newsletter" },
        { status: 500 }
      );
    }

    if (!finalNewsletter.upcomingShows || finalNewsletter.upcomingShows.length === 0) {
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
      finalNewsletter.themes && finalNewsletter.themes.length > 0
        ? `Sasha Bayan Shows: ${finalNewsletter.themes.join(", ")}`
        : finalNewsletter.dateRange
          ? `Sasha Bayan Shows - ${finalNewsletter.dateRange.start} to ${finalNewsletter.dateRange.end}`
          : `Sasha Bayan Shows - ${finalNewsletter.id}`;

    const emailReact = React.createElement(ShowNewsletterEmail, {
      newsletter: finalNewsletter,
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
      name: `${subject} (${finalNewsletter.dateRange.start} to ${finalNewsletter.dateRange.end})`,
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

    finalNewsletter.sentAt = new Date().toISOString();
    await saveNewsletterData(finalNewsletter);

    return NextResponse.json({
      success: true,
      message: "Show newsletter generated and sent successfully",
      newsletterId,
      broadcastId: broadcastResponse.data.id,
      sentAt: finalNewsletter.sentAt,
      generationTime,
      showsCount: finalNewsletter.upcomingShows.length,
      futureShowsCount: finalNewsletter.futureShows?.length || 0,
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
