import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Job, JobsOptions, RepeatOptions } from 'bullmq';
import { getRedisConfig } from '../../config/redis.config';
import { getQueueConfigs } from '../../config/queue.config';
import { QueueType } from './interfaces/queue-types.enum';
import { JobStatus, JobState } from './interfaces/job-status.interface';
import { QueueHealth, QueueMetrics } from './interfaces/queue-health.interface';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues: Map<QueueType, Queue> = new Map();
  private readonly queueConfigs: ReturnType<typeof getQueueConfigs>;

  constructor(private configService: ConfigService) {
    // Get Redis configuration from Task 1.4
    const redisOptions = getRedisConfig(this.configService);

    // BullMQ requires specific Redis options
    const bullmqConnection = {
      host: redisOptions.host,
      port: redisOptions.port,
      password: redisOptions.password,
      db: redisOptions.db,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false, // BullMQ recommendation
    };

    // Get queue configurations
    this.queueConfigs = getQueueConfigs(this.configService);

    // Initialize all queues
    Object.values(QueueType).forEach((queueType) => {
      const config = this.queueConfigs[queueType];

      const queue = new Queue(config.name, {
        connection: bullmqConnection,
        defaultJobOptions: config.defaultJobOptions,
      });

      // Set up event listeners for observability
      this.setupQueueEventListeners(queue, queueType);

      this.queues.set(queueType, queue);
      this.logger.log(`Queue "${queueType}" initialized`);
    });
  }

  /**
   * Add a job to a queue
   * @param queueType - Type of queue to add job to
   * @param jobName - Name of the job
   * @param data - Job data payload
   * @param options - Optional job-specific options
   * @returns Job instance with job ID
   */
  async addJob<T>(
    queueType: QueueType,
    jobName: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue "${queueType}" not found`);
    }

    try {
      const job = await queue.add(jobName, data, options);
      this.logger.log(`Job ${job.id} added to queue "${queueType}" with name "${jobName}"`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue "${queueType}": ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get job status by job ID
   * Searches across all queues to find the job
   * @param jobId - Job identifier
   * @returns Job status information
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    // Search for job across all queues
    for (const [queueType, queue] of this.queues.entries()) {
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          const state = (await job.getState()) as JobState;
          const progress = job.progress as number;

          return {
            jobId: job.id!,
            queue: queueType,
            name: job.name,
            state,
            progress: typeof progress === 'number' ? progress : 0,
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason,
            attemptsMade: job.attemptsMade,
            attemptsTotal: job.opts.attempts || 1,
            createdAt: new Date(job.timestamp),
            processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
            finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
          };
        }
      } catch (error) {
        // Continue searching in other queues
        this.logger.debug(
          `Job ${jobId} not found in queue "${queueType}": ${(error as Error).message}`,
        );
      }
    }

    // Job not found in any queue
    return {
      jobId,
      queue: QueueType.PAYROLL, // Default queue (not actually relevant)
      name: 'unknown',
      state: 'unknown',
      progress: 0,
      data: null,
      attemptsMade: 0,
      attemptsTotal: 0,
      createdAt: new Date(),
    };
  }

  /**
   * Get job by ID from a specific queue
   * @param queueType - Queue type to search in
   * @param jobId - Job identifier
   * @returns Job instance or null if not found
   */
  async getJob(queueType: QueueType, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue "${queueType}" not found`);
    }

    const job = await queue.getJob(jobId);
    return job || null;
  }

  /**
   * Add a repeatable/scheduled job
   * @param queueType - Queue type
   * @param jobName - Job name
   * @param data - Job data
   * @param repeat - Repeat options (cron pattern, timezone, etc.)
   * @returns Job instance
   */
  async addRepeatable<T>(
    queueType: QueueType,
    jobName: string,
    data: T,
    repeat: RepeatOptions,
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue "${queueType}" not found`);
    }

    try {
      const job = await queue.add(jobName, data, { repeat });
      this.logger.log(
        `Repeatable job ${job.id} added to queue "${queueType}" with pattern "${repeat.pattern}"`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add repeatable job to queue "${queueType}": ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Remove a repeatable job
   * @param queueType - Queue type
   * @param jobName - Job name
   * @param repeatId - Repeat job identifier
   */
  async removeRepeatable(queueType: QueueType, jobName: string, repeatId: string): Promise<void> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue "${queueType}" not found`);
    }

    try {
      await queue.removeRepeatableByKey(repeatId);
      this.logger.log(`Repeatable job "${jobName}" removed from queue "${queueType}"`);
    } catch (error) {
      this.logger.error(
        `Failed to remove repeatable job from queue "${queueType}": ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get health status for a specific queue
   * @param queueType - Queue type
   * @returns Queue health information
   */
  async getQueueHealth(queueType: QueueType): Promise<QueueHealth> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue "${queueType}" not found`);
    }

    try {
      const counts = await queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
      );

      const client = await queue.client;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isConnected = client && (client as any).status === 'ready';
      const failedRate =
        counts.completed + counts.failed > 0
          ? counts.failed / (counts.completed + counts.failed)
          : 0;
      const isHealthy = isConnected && failedRate < 0.1;

      return {
        name: queueType,
        isHealthy,
        connection: isConnected ? 'connected' : 'disconnected',
        counts: {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        },
        workers: 0, // Worker count would be tracked separately if workers implemented
      };
    } catch (error) {
      this.logger.error(
        `Failed to get health for queue "${queueType}": ${(error as Error).message}`,
      );
      return {
        name: queueType,
        isHealthy: false,
        connection: 'disconnected',
        counts: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        },
        workers: 0,
      };
    }
  }

  /**
   * Get metrics for all queues
   * @returns Array of queue metrics
   */
  async getAllQueueMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = [];

    for (const [queueType, queue] of this.queues.entries()) {
      try {
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        );

        const isPaused = await queue.isPaused();

        metrics.push({
          queue: queueType,
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
          paused: isPaused,
          isPaused,
        });
      } catch (error) {
        this.logger.error(
          `Failed to get metrics for queue "${queueType}": ${(error as Error).message}`,
        );
      }
    }

    return metrics;
  }

  /**
   * Set up event listeners for queue observability
   * @param queue - Queue instance
   * @param queueType - Queue type
   */
  private setupQueueEventListeners(queue: Queue, queueType: QueueType): void {
    queue.on('error', (error: Error) => {
      this.logger.error(`Queue "${queueType}" error: ${error.message}`);
    });

    queue.on('waiting', (job: { id?: string | number }) => {
      this.logger.debug(`Job ${job.id} waiting in queue "${queueType}"`);
    });

    // Note: BullMQ Queue emits events differently than Worker
    // These event handlers are for Queue-level events only
    // Worker events would be handled in worker implementation (future task)
  }

  /**
   * Get active jobs count across all queues
   * @returns Total number of active jobs
   */
  private async getActiveJobsCount(): Promise<number> {
    let total = 0;
    for (const queue of this.queues.values()) {
      try {
        const counts = await queue.getJobCounts('active');
        total += counts.active || 0;
      } catch (error) {
        // Continue counting other queues
      }
    }
    return total;
  }

  /**
   * Graceful shutdown for all queues
   * Implements OnModuleDestroy lifecycle hook
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Initiating graceful shutdown for all queues...');

    // 1. Pause all queues to stop accepting new jobs
    const pausePromises = Array.from(this.queues.values()).map((queue) =>
      queue.pause().catch((error) => {
        this.logger.warn(`Failed to pause queue: ${error.message}`);
      }),
    );
    await Promise.all(pausePromises);

    // 2. Wait for active jobs to complete (max 30 seconds)
    const timeout = 30000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const activeJobs = await this.getActiveJobsCount();
      if (activeJobs === 0) {
        this.logger.log('All active jobs completed');
        break;
      }
      this.logger.log(`Waiting for ${activeJobs} active jobs to complete...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 3. Close all queue connections
    const closePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close().catch((error) => {
        this.logger.warn(`Failed to close queue: ${error.message}`);
      }),
    );
    await Promise.all(closePromises);

    this.logger.log('All queues closed successfully');
  }
}
