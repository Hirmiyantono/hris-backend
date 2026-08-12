import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { CacheService } from './modules/cache/cache.service';

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
});
