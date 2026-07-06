// client/src/lib/utils.js
import { clsx } from "clsx";

/**
 * Consolidates Tailwind styling arrays
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Formats standard numeric tokens to INR Currency format (e.g. ₹5,000.50)
 * @param {number|string} val - Currency token
 * @returns {string} - Styled currency string
 */
export function formatCredits(val) {
  const numericVal = parseFloat(val || 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericVal);
  return `${formatted} 🪙`;
}

/**
 * Formats ISO strings to standard Indian time standard (e.g. 24 May 2026, 6:00 PM)
 * @param {string} dateString - ISO Date stamp
 * @returns {string} - Visual timestamp
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

/**
 * Truncates words seamlessly
 */
export function truncateText(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
