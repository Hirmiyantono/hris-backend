import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueType } from './interfaces/queue-types.enum';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: number | string) => {
              const config: Record<string, number | string> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_DB: 0,
                QUEUE_PAYROLL_CONCURRENCY: 2,
                QUEUE_NOTIFICATION_CONCURRENCY: 10,
                QUEUE_REPORT_CONCURRENCY: 3,
                QUEUE_MAINTENANCE_CONCURRENCY: 1,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addJob', () => {
    it('should add a job to the payroll queue', async () => {
      const jobData = { companyId: '123', periodId: '2024-01' };
      const job = await service.addJob(QueueType.PAYROLL, 'test-job', jobData);

      expect(job).toBeDefined();
      expect(job.id).toBe('mock-job-id');
    });

    it('should add a job to the notification queue', async () => {
      const jobData = { userId: '456', message: 'Test notification' };
      const job = await service.addJob(QueueType.NOTIFICATION, 'send-notification', jobData);

      expect(job).toBeDefined();
      expect(job.id).toBe('mock-job-id');
    });

    it('should add a job with custom options', async () => {
      const jobData = { test: 'data' };
      const options = { priority: 1, delay: 5000 };

      const job = await service.addJob(QueueType.PAYROLL, 'test-job', jobData, options);

      expect(job).toBeDefined();
    });

    it('should throw error for invalid queue type', async () => {
      await expect(service.addJob('invalid-queue' as QueueType, 'test-job', {})).rejects.toThrow();
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for existing job', async () => {
      const status = await service.getJobStatus('mock-job-id');

      expect(status).toBeDefined();
      expect(status.jobId).toBe('mock-job-id');
      expect(status.state).toBeDefined();
    });

    it('should return unknown state for non-existent job', async () => {
      // Create a mock queue that returns null for getJob
      const mockQueue = {
        getJob: jest.fn().mockResolvedValue(null),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).queues.clear(); // Clear all queues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).queues.set(QueueType.PAYROLL, mockQueue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).queues.set(QueueType.NOTIFICATION, mockQueue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).queues.set(QueueType.REPORT, mockQueue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).queues.set(QueueType.MAINTENANCE, mockQueue);

      const status = await service.getJobStatus('non-existent-job');

      expect(status.state).toBe('unknown');
    });
  });

  describe('getQueueHealth', () => {
    it('should return health status for payroll queue', async () => {
      const health = await service.getQueueHealth(QueueType.PAYROLL);

      expect(health).toBeDefined();
      expect(health.name).toBe(QueueType.PAYROLL);
      expect(health.connection).toBeDefined();
      expect(health.counts).toBeDefined();
    });

    it('should return health status for all queue types', async () => {
      const queueTypes = [
        QueueType.PAYROLL,
        QueueType.NOTIFICATION,
        QueueType.REPORT,
        QueueType.MAINTENANCE,
      ];

      for (const queueType of queueTypes) {
        const health = await service.getQueueHealth(queueType);
        expect(health.name).toBe(queueType);
      }
    });
  });

  describe('getAllQueueMetrics', () => {
    it('should return metrics for all queues', async () => {
      const metrics = await service.getAllQueueMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.length).toBe(4); // 4 queue types
      expect(metrics[0]).toHaveProperty('queue');
      expect(metrics[0]).toHaveProperty('waiting');
      expect(metrics[0]).toHaveProperty('active');
      expect(metrics[0]).toHaveProperty('completed');
      expect(metrics[0]).toHaveProperty('failed');
    });
  });

  describe('addRepeatable', () => {
    it('should add a repeatable job', async () => {
      const jobData = { task: 'daily-cleanup' };
      const repeat = {
        pattern: '0 0 * * *', // Daily at midnight
        tz: 'Asia/Jakarta',
      };

      const job = await service.addRepeatable(QueueType.MAINTENANCE, 'cleanup', jobData, repeat);

      expect(job).toBeDefined();
    });
  });

  describe('graceful shutdown', () => {
    it('should pause and close all queues on module destroy', async () => {
      const mockQueue = {
        pause: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        getJobCounts: jest.fn().mockResolvedValue({ active: 0 }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).queues.set(QueueType.PAYROLL, mockQueue);

      await service.onModuleDestroy();

      expect(mockQueue.pause).toHaveBeenCalled();
      expect(mockQueue.close).toHaveBeenCalled();
    });
  });
});
