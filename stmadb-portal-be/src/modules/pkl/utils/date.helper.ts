// src/modules/pkl/utils/date.helper.ts

import { differenceInHours, differenceInMinutes, parseISO, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/**
 * Calculate total hours between two datetime
 */
export function calculateTotalHours(startTime: Date, endTime: Date): number {
  const diffMinutes = differenceInMinutes(endTime, startTime);
  const totalHours = diffMinutes / 60;
  return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
}

/**
 * Format date to Indonesian format
 */
export function formatDateIndonesian(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEEE, dd MMMM yyyy', { locale: localeId });
}

/**
 * Format time to WIB
 */
export function formatTimeWIB(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm') + ' WIB';
}

/**
 * Check if current time is within grace period
 */
export function isWithinGracePeriod(
  currentTime: Date,
  targetTime: Date,
  gracePeriodMinutes: number
): boolean {
  const diff = differenceInMinutes(currentTime, targetTime);
  return Math.abs(diff) <= gracePeriodMinutes;
}

/**
 * Get start and end of day
 */
export function getStartAndEndOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
