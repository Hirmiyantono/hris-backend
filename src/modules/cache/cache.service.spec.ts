import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockRedisClient: {
    get: jest.Mock;
    set: jest.Mock;
    setex: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
    exists: jest.Mock;
    expire: jest.Mock;
    ttl: jest.Mock;
    ping: jest.Mock;
    info: jest.Mock;
    quit: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string | number) => {
              const config: Record<string, string | number> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_DB: 0,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);

    // Get the mocked Redis client instance from the service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockRedisClient = (service as any).redisClient;
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (service) {
      await service.onModuleDestroy();
    }
  });

  afterEach(async () => {
    // Clean up service
    if (service) {
      await service.onModuleDestroy();
    }
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const testValue = { data: 'test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testValue));

      const result = await service.get('test-key');

      expect(result).toEqual(testValue);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set('test-key', { data: 'test' });

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'test' }),
      );
    });

    it('should set value with TTL', async () => {
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.set('test-key', { data: 'test' }, 3600);

      expect(result).toBe(true);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify({ data: 'test' }),
      );
    });

    it('should return false on error', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

      const result = await service.set('error-key', 'value');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete key successfully', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.delete('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should return false on error', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      const result = await service.delete('error-key');

      expect(result).toBe(false);
    });
  });

  describe('deletePattern', () => {
    it('should delete keys matching pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedisClient.del.mockResolvedValue(3);

      const result = await service.deletePattern('test:*');

      expect(result).toBe(3);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should return 0 when no keys match pattern', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await service.deletePattern('test:*');

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should return 0 on error', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      const result = await service.deletePattern('error:*');

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.exists('test-key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.exists('nonexistent-key');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedisClient.exists.mockRejectedValue(new Error('Redis error'));

      const result = await service.exists('error-key');

      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('should set expiration successfully', async () => {
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.expire('test-key', 3600);

      expect(result).toBe(true);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 3600);
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.expire.mockResolvedValue(0);

      const result = await service.expire('nonexistent-key', 3600);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedisClient.expire.mockRejectedValue(new Error('Redis error'));

      const result = await service.expire('error-key', 3600);

      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return TTL value', async () => {
      mockRedisClient.ttl.mockResolvedValue(3600);

      const result = await service.ttl('test-key');

      expect(result).toBe(3600);
    });

    it('should return -1 on error', async () => {
      mockRedisClient.ttl.mockRejectedValue(new Error('Redis error'));

      const result = await service.ttl('error-key');

      expect(result).toBe(-1);
    });
  });

  describe('ping', () => {
    it('should return true when Redis responds with PONG', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.ping();

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis error'));

      const result = await service.ping();

      expect(result).toBe(false);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return true when connected and ready', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).isConnected = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).redisClient.status = 'ready';

      const result = service.getConnectionStatus();

      expect(result).toBe(true);
    });

    it('should return false when not connected', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).isConnected = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).redisClient.status = 'ready';

      const result = service.getConnectionStatus();

      expect(result).toBe(false);
    });

    it('should return false when status is not ready', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).isConnected = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).redisClient.status = 'connecting';

      const result = service.getConnectionStatus();

      expect(result).toBe(false);
    });
  });

  describe('getInfo', () => {
    it('should return Redis info', async () => {
      const infoString = '# Server\nredis_version:7.0.0';
      mockRedisClient.info.mockResolvedValue(infoString);

      const result = await service.getInfo();

      expect(result).toBe(infoString);
    });

    it('should return null on error', async () => {
      mockRedisClient.info.mockRejectedValue(new Error('Redis error'));

      const result = await service.getInfo();

      expect(result).toBeNull();
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis connection', async () => {
      mockRedisClient.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });
});
