import { ConfigService } from '@nestjs/config';
import { QueueConfig } from '../modules/queue/interfaces/queue-config.interface';
import { QueueType } from '../modules/queue/interfaces/queue-types.enum';

/**
 * Get queue-specific configuration
 * Configurations follow design.md specifications with corrected exponential backoff
 */
export const getQueueConfigs = (configService: ConfigService): Record<QueueType, QueueConfig> => {
  return {
    [QueueType.PAYROLL]: {
      name: QueueType.PAYROLL,
      priority: 10, // Highest priority
      concurrency: configService.get<number>('QUEUE_PAYROLL_CONCURRENCY', 2),
      rateLimit: {
        max: 10,
        duration: 60000, // 1 minute
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 10s, 20s retry schedule
        },
        timeout: 1800000, // 30 minutes
        removeOnComplete: 100,
        removeOnFail: 500,
        priority: 1,
      },
    },
    [QueueType.NOTIFICATION]: {
      name: QueueType.NOTIFICATION,
      priority: 7, // Medium-high priority
      concurrency: configService.get<number>('QUEUE_NOTIFICATION_CONCURRENCY', 10),
      rateLimit: {
        max: 100,
        duration: 60000, // 1 minute
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 4s, 8s retry schedule
        },
        timeout: 60000, // 1 minute
        removeOnComplete: 100,
        removeOnFail: 500,
        priority: 5,
      },
    },
    [QueueType.REPORT]: {
      name: QueueType.REPORT,
      priority: 3, // Low priority
      concurrency: configService.get<number>('QUEUE_REPORT_CONCURRENCY', 3),
      rateLimit: {
        max: 20,
        duration: 60000, // 1 minute
      },
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000, // 20s retry schedule
        },
        timeout: 3600000, // 60 minutes
        removeOnComplete: 50,
        removeOnFail: 200,
        priority: 10,
      },
    },
    [QueueType.MAINTENANCE]: {
      name: QueueType.MAINTENANCE,
      priority: 5, // Medium priority
      concurrency: configService.get<number>('QUEUE_MAINTENANCE_CONCURRENCY', 1),
      rateLimit: {
        max: 10,
        duration: 60000, // 1 minute
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 10s, 20s retry schedule
        },
        timeout: 600000, // 10 minutes
        removeOnComplete: 100,
        removeOnFail: 500,
        priority: 5,
      },
    },
  };
};
