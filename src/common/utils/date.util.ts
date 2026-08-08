/**
 * Date utility functions
 */

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Calculate the number of working days between two dates
 * Excludes weekends
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Format date to ISO string without time component
 */
export function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}
