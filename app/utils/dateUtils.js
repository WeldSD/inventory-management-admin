// lib/utils.js (or wherever you store your utilities)

/**
 * Formats a timestamp into a localized string representation.
 * Handles both Firestore Timestamps and string-based timestamps.
 * @param {import('firebase/firestore').Timestamp | string | null | undefined} timestamp - The timestamp to format
 * @returns {string} - Formatted date string or 'No date available' if invalid
 */
export function formatDateTime(timestamp) {
  // Check if timestamp is a Firestore Timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString();
  } 
  // Handle string timestamps
  else if (timestamp) {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'No date available' : date.toLocaleString();
  }
  return 'No date available';
}

/**
 * Gets the 5:00 PM MST cutoff time for a given date.
 * @param {Date} date - The date to base the cutoff on
 * @returns {Date} - A new Date object set to 5:00 PM MST of the input date
 */
export function getCutoffTime(date) {
  const cutoff = new Date(date);
  // Set to 5:00 PM MST (17:00)
  cutoff.setHours(17, 0, 0, 0);
  return cutoff;
}

/**
 * Determines if an item is overdue based on its checkout timestamp and current time.
 * An item is overdue if it was checked out before today or before today's 5:00 PM MST cutoff
 * while the current time is past the cutoff.
 * @param {import('firebase/firestore').Timestamp | string | null | undefined} timestamp - The checkout timestamp
 * @param {Date} currentTime - The current time to compare against
 * @returns {boolean} - True if the item is overdue, false otherwise
 */
export function isItemOverdue(timestamp, currentTime) {
  if (!timestamp) return false;

  let checkoutTime;
  if (typeof timestamp.toDate === 'function') {
    checkoutTime = timestamp.toDate();
  } else {
    checkoutTime = new Date(timestamp);
    if (isNaN(checkoutTime.getTime())) return false; // Invalid date check
  }

  // Get the start of today for checking previous days
  const todayStart = new Date(currentTime);
  todayStart.setHours(0, 0, 0, 0);

  // Check if the item was checked out on a previous day
  const isPreviousDayCheckout = checkoutTime < todayStart;

  // Check if current time is past today's cutoff and item was checked out before cutoff
  const todayCutoff = getCutoffTime(currentTime);
  const isPastCutoffToday = currentTime > todayCutoff && checkoutTime < todayCutoff;

  return isPreviousDayCheckout || isPastCutoffToday;
}

// Export existing cn utility from shadcn/ui (if not already in this file)
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge for Tailwind CSS compatibility.
 * @param {...any} inputs - Class names or conditions to merge
 * @returns {string} - Merged class name string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}