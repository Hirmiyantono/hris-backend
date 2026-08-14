import { QueueType } from './queue-types.enum';

/**
 * Configuration interface for a queue
 */
export interface QueueConfig {
  /** Queue name/type */
  name: QueueType;

  /** Queue priority (1-10, higher = more important) */
  priority: number;

  /** Maximum concurrent jobs */
  concurrency: number;

  /** Rate limiting configuration */
  rateLimit: {
    /** Maximum jobs per duration */
    max: number;
    /** Duration in milliseconds */
    duration: number;
  };

  /** Default job options */
  defaultJobOptions: {
    /** Number of retry attempts */
    attempts: number;

    /** Exponential backoff configuration */
    backoff: {
      /** Backoff type */
      type: 'exponential';
      /** Initial delay in milliseconds
       * BullMQ exponential backoff formula: 2^(attemptsMade - 1) * delay
       * Example with delay=5000ms, attempts=3:
       * - Attempt 1: Immediate
       * - Retry 1 (attempt 2): Wait 2^1 * 5000 = 10,000ms (10 seconds)
       * - Retry 2 (attempt 3): Wait 2^2 * 5000 = 20,000ms (20 seconds)
       */
      delay: number;
    };

    /** Job timeout in milliseconds */
    timeout: number;

    /** Number of completed jobs to keep */
    removeOnComplete: number;

    /** Number of failed jobs to keep */
    removeOnFail: number;

    /** Job priority within queue (lower = higher priority) */
    priority?: number;
  };
}
