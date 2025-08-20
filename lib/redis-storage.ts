/**
 * Redis Storage Layer for Show Newsletter System using Upstash Redis
 */

import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

export interface ShowNewsletter {
  id: string;
  generatedAt: string;
  dateRange: { start: string; end: string };
  sentAt: string | null;
  intro: string;
  themes: string[];
  upcomingShows: Array<{
    title: string;
    date: string;
    venue: string;
    address: string;
    startTime: string;
    endTime: string;
    ticketLink?: string;
    note?: string;
    description?: string;
  }>;
  futureShows?: Array<{
    title: string;
    date: string;
    venue: string;
    address: string;
    startTime: string;
    endTime: string;
    ticketLink?: string;
    note?: string;
    description?: string;
  }>;
}

export interface ShowTracking {
  lastUpdated: string;
  shows: Record<string, { lastFeatured: string; count: number }>;
}

export interface NewsletterCounter {
  totalNewsletters: number;
  lastNewsletterId: string;
  newsletters: string[];
}

let redis: Redis | null = null;
try {
  redis = Redis.fromEnv();
} catch (error) {
  console.warn(
    "⚠️ Upstash Redis not configured, will use filesystem fallback:",
    error,
  );
}

const getDataDir = () => path.join(process.cwd(), "data");
const getNewslettersDir = () => path.join(getDataDir(), "newsletters");

export async function loadShowNewsletter(
  newsletterId: string,
): Promise<ShowNewsletter> {
  if (redis) {
    try {
      const data = await redis.get(`show-newsletter:${newsletterId}`);
      if (data) {
        console.log(`📡 Loaded show newsletter from Redis: ${newsletterId}`);
        return data as ShowNewsletter;
      }
    } catch (error) {
      console.warn(`⚠️ Redis read failed for ${newsletterId}:`, error);
    }
  }

  const newsletterPath = path.join(getNewslettersDir(), `${newsletterId}.json`);
  if (fs.existsSync(newsletterPath)) {
    const content = fs.readFileSync(newsletterPath, "utf8");
    const newsletter = JSON.parse(content);
    console.log(`📁 Loaded show newsletter from filesystem: ${newsletterId}`);
    return newsletter;
  }

  throw new Error(`Show newsletter not found: ${newsletterId}`);
}

export async function saveShowNewsletter(
  newsletterId: string,
  newsletter: ShowNewsletter,
): Promise<void> {
  if (redis) {
    try {
      await redis.set(`show-newsletter:${newsletterId}`, newsletter);
      console.log(`💾 Saved show newsletter to Redis: ${newsletterId}`);
      return;
    } catch (error) {
      console.warn(`⚠️ Redis write failed for ${newsletterId}:`, error);
    }
  }

  if (!fs.existsSync(getNewslettersDir())) {
    fs.mkdirSync(getNewslettersDir(), { recursive: true });
  }

  const newsletterPath = path.join(getNewslettersDir(), `${newsletterId}.json`);
  fs.writeFileSync(newsletterPath, JSON.stringify(newsletter, null, 2));
  console.log(`💾 Saved show newsletter to filesystem: ${newsletterId}`);
}

export async function showNewsletterExists(newsletterId: string): Promise<boolean> {
  if (redis) {
    try {
      const exists = await redis.exists(`show-newsletter:${newsletterId}`);
      if (exists) {
        return true;
      }
    } catch (error) {
      console.warn(`⚠️ Redis exists check failed for ${newsletterId}:`, error);
    }
  }

  const newsletterPath = path.join(getNewslettersDir(), `${newsletterId}.json`);
  return fs.existsSync(newsletterPath);
}

export async function loadShowTracking(): Promise<ShowTracking> {
  if (redis) {
    try {
      const data = await redis.get("shows:tracking");
      if (data) {
        console.log("📡 Loaded show tracking from Redis");
        return data as ShowTracking;
      }
    } catch (error) {
      console.warn("⚠️ Redis read failed for show tracking:", error);
    }
  }

  const trackingPath = path.join(getDataDir(), "show-tracking.json");
  if (fs.existsSync(trackingPath)) {
    const content = fs.readFileSync(trackingPath, "utf8");
    const tracking = JSON.parse(content);
    console.log("📁 Loaded show tracking from filesystem");
    return tracking;
  }

  console.log("🆕 Creating new show tracking");
  return {
    lastUpdated: new Date().toISOString(),
    shows: {},
  };
}

export async function saveShowTracking(
  tracking: ShowTracking,
): Promise<void> {
  tracking.lastUpdated = new Date().toISOString();

  if (redis) {
    try {
      await redis.set("shows:tracking", tracking);
      console.log("💾 Saved show tracking to Redis");
      return;
    } catch (error) {
      console.warn("⚠️ Redis write failed for show tracking:", error);
    }
  }

  if (!fs.existsSync(getDataDir())) {
    fs.mkdirSync(getDataDir(), { recursive: true });
  }

  const trackingPath = path.join(getDataDir(), "show-tracking.json");
  fs.writeFileSync(trackingPath, JSON.stringify(tracking, null, 2));
  console.log("💾 Saved show tracking to filesystem");
}

export async function getNewsletterCounter(): Promise<NewsletterCounter> {
  const COUNTER_KEY = "show-newsletter:counter";
  
  try {
    if (redis) {
      console.log("📊 Loading newsletter counter from Redis");
      const counter = await redis.get<NewsletterCounter>(COUNTER_KEY);
      if (counter) {
        return counter;
      }
    }
  } catch (error) {
    console.warn("⚠️ Redis counter read failed:", error);
  }

  const counterPath = path.join(getDataDir(), "newsletter-counter.json");
  if (fs.existsSync(counterPath)) {
    console.log("📁 Loading newsletter counter from filesystem");
    const counterData = fs.readFileSync(counterPath, "utf8");
    return JSON.parse(counterData);
  }

  const initialCounter: NewsletterCounter = {
    totalNewsletters: 0,
    lastNewsletterId: "",
    newsletters: [],
  };
  await saveNewsletterCounter(initialCounter);
  return initialCounter;
}

export async function saveNewsletterCounter(
  counter: NewsletterCounter,
): Promise<void> {
  const COUNTER_KEY = "show-newsletter:counter";
  
  try {
    if (redis) {
      console.log("💾 Saving newsletter counter to Redis");
      await redis.set(COUNTER_KEY, counter);
      return;
    }
  } catch (error) {
    console.warn("⚠️ Redis counter save failed:", error);
  }

  try {
    const counterPath = path.join(getDataDir(), "newsletter-counter.json");
    fs.writeFileSync(counterPath, JSON.stringify(counter, null, 2));
    console.log("📁 Newsletter counter saved to filesystem backup");
  } catch (fsError) {
    console.warn(
      "⚠️ Filesystem counter save failed (likely production read-only):",
      fsError,
    );
  }
}

export async function addNewsletterToCounter(
  newsletterId: string,
  isTestMode: boolean = false,
): Promise<number> {
  const counter = await getNewsletterCounter();

  if (counter.newsletters.includes(newsletterId)) {
    return counter.newsletters.indexOf(newsletterId) + 1;
  }

  if (isTestMode) {
    counter.newsletters.push(newsletterId);
    counter.totalNewsletters = counter.newsletters.length;
    counter.lastNewsletterId = newsletterId;
    await saveNewsletterCounter(counter);
    console.log(
      `🧪 Test newsletter counted: ${newsletterId} as #${counter.totalNewsletters}`,
    );
    return counter.totalNewsletters;
  }

  if (
    newsletterId.includes("-to-") &&
    newsletterId.match(/^\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}$/)
  ) {
    counter.newsletters.push(newsletterId);
    counter.totalNewsletters = counter.newsletters.length;
    counter.lastNewsletterId = newsletterId;

    await saveNewsletterCounter(counter);
    return counter.totalNewsletters;
  } else {
    console.log(
      `📊 Non-standard newsletter detected: ${newsletterId}, not counting towards total`,
    );
    return counter.totalNewsletters + 1;
  }
}

export async function healthCheck(): Promise<{
  redis: boolean;
  filesystem: boolean;
}> {
  let redisStatus = false;
  if (redis) {
    try {
      await redis.ping();
      redisStatus = true;
    } catch (error) {
      console.warn("⚠️ Redis health check failed:", error);
    }
  }

  const filesystemStatus = fs.existsSync(getDataDir());

  return {
    redis: redisStatus,
    filesystem: filesystemStatus,
  };
}
