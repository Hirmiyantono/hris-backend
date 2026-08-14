/**
 * Queue types for background job processing
 * Each queue has specific priority, concurrency, and timeout configurations
 */
export enum QueueType {
  /**
   * High-priority queue for payroll calculations
   * - Priority: 10 (highest)
   * - Concurrency: 2
   * - Timeout: 30 minutes
   */
  PAYROLL = 'payroll',

  /**
   * Medium-priority queue for email and notification delivery
   * - Priority: 7
   * - Concurrency: 10
   * - Timeout: 1 minute
   */
  NOTIFICATION = 'notification',

  /**
   * Low-priority queue for report generation
   * - Priority: 3
   * - Concurrency: 3
   * - Timeout: 60 minutes
   */
  REPORT = 'report',

  /**
   * Medium-priority queue for scheduled maintenance tasks
   * - Priority: 5
   * - Concurrency: 1
   * - Timeout: 10 minutes
   */
  MAINTENANCE = 'maintenance',
}
