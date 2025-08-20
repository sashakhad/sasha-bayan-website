/**
 * Centralized date utilities using date-fns for consistent, timezone-safe date handling
 * 
 * CRITICAL: Always use these utilities instead of native Date() constructor
 * to avoid timezone shifting issues with date strings like "2025-09-05"
 */

import { format, parse, parseISO, addDays, startOfWeek, endOfWeek, isAfter, isBefore, isEqual } from "date-fns";

/**
 * Parse a date string in YYYY-MM-DD format as a local date (no timezone shifting)
 * This ensures "2025-09-05" represents September 5th, not September 4th due to UTC conversion
 */
export function parseDateString(dateString: string): Date {
  return parse(dateString, "yyyy-MM-dd", new Date());
}

/**
 * Format a date string for display in newsletters and UI
 */
export function formatDateForDisplay(dateString: string): string {
  const date = parseDateString(dateString);
  return format(date, "EEEE, MMMM d, yyyy"); // "Friday, September 5, 2025"
}

/**
 * Format a date string for short display (used in ShowCard)
 */
export function formatDateShort(dateString: string): string {
  const date = parseDateString(dateString);
  return format(date, "MM.dd.yyyy"); // "09.05.2025"
}

/**
 * Format a date range for newsletter headers
 */
export function formatDateRange(startDateString: string, endDateString: string): string {
  const startDate = parseDateString(startDateString);
  const endDate = parseDateString(endDateString);
  
  const startMonth = format(startDate, "MMMM");
  const endMonth = format(endDate, "MMMM");
  const year = format(startDate, "yyyy");
  
  if (startMonth === endMonth) {
    return `${startMonth} ${format(startDate, "d")}-${format(endDate, "d")}, ${year}`;
  } else {
    return `${format(startDate, "MMMM d")} - ${format(endDate, "MMMM d")}, ${year}`;
  }
}

/**
 * Get current date range for newsletter (current week + next week)
 */
export function getCurrentNewsletterDateRange(): { start: string; end: string } {
  const now = new Date();
  
  // Get end of current week (Sunday)
  const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 }); // Monday = 1
  
  // Get end of next week
  const endOfNextWeek = addDays(endOfCurrentWeek, 7);
  
  return {
    start: format(now, "yyyy-MM-dd"),
    end: format(endOfNextWeek, "yyyy-MM-dd"),
  };
}

/**
 * Check if a show date is in the future
 */
export function isShowInFuture(showDateString: string): boolean {
  const showDate = parseDateString(showDateString);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return isAfter(showDate, todayStart) || isEqual(showDate, todayStart);
}

/**
 * Check if a show date is within a date range
 */
export function isShowInDateRange(showDateString: string, startDateString: string, endDateString: string): boolean {
  const showDate = parseDateString(showDateString);
  const startDate = parseDateString(startDateString);
  const endDate = parseDateString(endDateString);
  
  return (isAfter(showDate, startDate) || isEqual(showDate, startDate)) &&
         (isBefore(showDate, endDate) || isEqual(showDate, endDate));
}

/**
 * Get future shows date range (for "Coming Up" section)
 */
export function getFutureShowsDateRange(currentRangeEnd: string): { start: string; end: string } {
  const futureStart = addDays(parseDateString(currentRangeEnd), 1);
  const futureEnd = addDays(futureStart, 90); // Next 3 months
  
  return {
    start: format(futureStart, "yyyy-MM-dd"),
    end: format(futureEnd, "yyyy-MM-dd"),
  };
}

/**
 * Format date for ISO string (for newsletter metadata)
 */
export function formatDateISO(date: Date = new Date()): string {
  return date.toISOString();
}
