import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { CacheService } from './modules/cache/cache.service';
import { QueueService } from './modules/queue/queue.service';
import { QueueType } from './modules/queue/interfaces/queue-types.enum';

describe('AppController', () => {
  let appController: AppController;

  const mockDataSource = {
    options: {
      database: 'test_db',
    },
    query: jest.fn(),
  };

  const mockCacheService = {
    ping: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getConnectionStatus: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const mockQueueService = {
    getQueueHealth: jest.fn(),
    getJobStatus: jest.fn(),
    getAllQueueMetrics: jest.fn(),
    addJob: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return application status', () => {
      const result = appController.getStatus();
      expect(result).toHaveProperty('status', 'success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('uptime');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return database health when connected', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ 1: 1 }]);

      const result = await appController.getDatabaseHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('isConnected', true);
      expect(result).toHaveProperty('database', 'test_db');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return database health when not connected', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await appController.getDatabaseHealth();
      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('isConnected', false);
      expect(result).toHaveProperty('error', 'Connection failed');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('getRedisHealth', () => {
    it('should return Redis health when connected', async () => {
      mockCacheService.ping.mockResolvedValueOnce(true);

      const result = await appController.getRedisHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('isConnected', true);
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return Redis health when not connected', async () => {
      mockCacheService.ping.mockResolvedValueOnce(false);

      const result = await appController.getRedisHealth();
      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('isConnected', false);
      expect(result).toHaveProperty('error', 'Redis ping failed');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle Redis ping errors', async () => {
      mockCacheService.ping.mockRejectedValueOnce(new Error('Redis connection error'));

      const result = await appController.getRedisHealth();
      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('isConnected', false);
      expect(result).toHaveProperty('error', 'Redis connection error');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('getQueuesHealth', () => {
    it('should return healthy status when all queues are healthy', async () => {
      mockQueueService.getQueueHealth.mockResolvedValue({
        name: QueueType.PAYROLL,
        isHealthy: true,
        connection: 'connected',
        counts: { waiting: 0, active: 0, completed: 10, failed: 0, delayed: 0 },
        workers: 0,
      });

      const result = await appController.getQueuesHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('queues');
      expect(result.queues).toHaveLength(4);
      expect(result).toHaveProperty('timestamp');
    });

    it('should return degraded status when some queues are unhealthy', async () => {
      mockQueueService.getQueueHealth
        .mockResolvedValueOnce({
          name: QueueType.PAYROLL,
          isHealthy: true,
          connection: 'connected',
          counts: { waiting: 0, active: 0, completed: 10, failed: 0, delayed: 0 },
          workers: 0,
        })
        .mockResolvedValueOnce({
          name: QueueType.NOTIFICATION,
          isHealthy: false,
          connection: 'disconnected',
          counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
          workers: 0,
        })
        .mockResolvedValueOnce({
          name: QueueType.REPORT,
          isHealthy: true,
          connection: 'connected',
          counts: { waiting: 0, active: 0, completed: 5, failed: 0, delayed: 0 },
          workers: 0,
        })
        .mockResolvedValueOnce({
          name: QueueType.MAINTENANCE,
          isHealthy: true,
          connection: 'connected',
          counts: { waiting: 0, active: 0, completed: 3, failed: 0, delayed: 0 },
          workers: 0,
        });

      const result = await appController.getQueuesHealth();

      expect(result).toHaveProperty('status', 'degraded');
      expect(result.queues).toHaveLength(4);
    });

    it('should return unhealthy status when all queues are unhealthy', async () => {
      mockQueueService.getQueueHealth.mockResolvedValue({
        name: QueueType.PAYROLL,
        isHealthy: false,
        connection: 'disconnected',
        counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
        workers: 0,
      });

      const result = await appController.getQueuesHealth();

      expect(result).toHaveProperty('status', 'unhealthy');
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for valid job ID', async () => {
      const mockJobStatus = {
        jobId: 'test-job-123',
        queue: QueueType.PAYROLL,
        name: 'process-payroll',
        state: 'completed' as const,
        progress: 100,
        data: { companyId: '123' },
        result: { success: true },
        attemptsMade: 1,
        attemptsTotal: 3,
        createdAt: new Date(),
      };

      mockQueueService.getJobStatus.mockResolvedValueOnce(mockJobStatus);

      const result = await appController.getJobStatus('test-job-123');

      expect(result).toBeDefined();
      expect(result.jobId).toBe('test-job-123');
      expect(result.state).toBe('completed');
      expect(result.progress).toBe(100);
    });

    it('should return unknown state for non-existent job', async () => {
      mockQueueService.getJobStatus.mockResolvedValueOnce({
        jobId: 'non-existent',
        queue: QueueType.PAYROLL,
        name: 'unknown',
        state: 'unknown' as const,
        progress: 0,
        data: null,
        attemptsMade: 0,
        attemptsTotal: 0,
        createdAt: new Date(),
      });

      const result = await appController.getJobStatus('non-existent');

      expect(result.state).toBe('unknown');
    });
  });
});
