import { QueueType } from './queue-types.enum';

/**
 * Job state enumeration
 */
export type JobState =
  | 'waiting' // Job is queued, waiting to be processed
  | 'active' // Job is currently being processed
  | 'completed' // Job completed successfully
  | 'failed' // Job failed after all retries
  | 'delayed' // Job is waiting for retry after failure
  | 'unknown'; // Job not found

/**
 * Job status information
 */
export interface JobStatus {
  /** Unique job identifier */
  jobId: string;

  /** Queue type */
  queue: QueueType;

  /** Job name */
  name: string;

  /** Current job state */
  state: JobState;

  /** Job progress (0-100) */
  progress: number;

  /** Job data payload */
  data: unknown;

  /** Job result (if completed) */
  result?: unknown;

  /** Failure reason (if failed) */
  failedReason?: string;

  /** Number of attempts made */
  attemptsMade: number;

  /** Total number of attempts allowed */
  attemptsTotal: number;

  /** Job creation timestamp */
  createdAt: Date;

  /** Job processing start timestamp */
  processedAt?: Date;

  /** Job completion timestamp */
  finishedAt?: Date;
}
