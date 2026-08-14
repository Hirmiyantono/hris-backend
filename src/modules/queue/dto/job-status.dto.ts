import { JobState, JobStatus } from '../interfaces/job-status.interface';
import { QueueType } from '../interfaces/queue-types.enum';

/**
 * DTO for job status response
 */
export class JobStatusDto implements JobStatus {
  jobId!: string;
  queue!: QueueType;
  name!: string;
  state!: JobState;
  progress!: number;
  data!: unknown;
  result?: unknown;
  failedReason?: string;
  attemptsMade!: number;
  attemptsTotal!: number;
  createdAt!: Date;
  processedAt?: Date;
  finishedAt?: Date;

  constructor(partial: Partial<JobStatusDto>) {
    Object.assign(this, partial);
  }
}
