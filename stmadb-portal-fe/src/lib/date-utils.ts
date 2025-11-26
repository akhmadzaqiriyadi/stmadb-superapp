// Date utility functions for handling Jakarta timezone (WIB/UTC+7)

/**
 * Get current date in Jakarta timezone as Date object
 */
export function getJakartaTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

/**
 * Get current date in Jakarta timezone formatted as yyyy-MM-dd
 */
export function getJakartaDateString(): string {
  const jakartaTime = getJakartaTime();
  return jakartaTime.toISOString().split('T')[0];
}

/**
 * Convert a date to Jakarta timezone ISO string
 * This is useful for sending dates to backend that expects Jakarta time
 */
export function toJakartaISOString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const jakartaTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  return jakartaTime.toISOString();
}

/**
 * Format date to yyyy-MM-dd in Jakarta timezone
 */
export function formatJakartaDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const jakartaTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const year = jakartaTime.getFullYear();
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const day = String(jakartaTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
