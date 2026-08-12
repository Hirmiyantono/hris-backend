import { ConfigService } from '@nestjs/config';
import { getRedisConfig } from './redis.config';

describe('Redis Configuration', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      REDIS_HOST: 'test-redis',
      REDIS_PORT: 6380,
      REDIS_PASSWORD: 'test-password',
      REDIS_DB: 1,
    });
  });

  describe('getRedisConfig', () => {
    it('should return Redis configuration with provided values', () => {
      const config = getRedisConfig(configService);

      expect(config).toBeDefined();
      expect(config.host).toBe('test-redis');
      expect(config.port).toBe(6380);
      expect(config.password).toBe('test-password');
      expect(config.db).toBe(1);
    });

    it('should use default values when environment variables are not set', () => {
      const emptyConfigService = new ConfigService({});
      const config = getRedisConfig(emptyConfigService);

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(6379);
      expect(config.db).toBe(0);
      expect(config.password).toBeUndefined();
    });

    it('should have retry strategy configured', () => {
      const config = getRedisConfig(configService);

      expect(config.retryStrategy).toBeDefined();
      expect(typeof config.retryStrategy).toBe('function');

      // Test retry strategy behavior
      const retryStrategy = config.retryStrategy as (times: number) => number | void;
      expect(retryStrategy(1)).toBe(50);
      expect(retryStrategy(10)).toBe(500);
      expect(retryStrategy(50)).toBe(2000); // Max delay
    });

    it('should have correct connection options', () => {
      const config = getRedisConfig(configService);

      expect(config.maxRetriesPerRequest).toBe(3);
      expect(config.enableReadyCheck).toBe(true);
      expect(config.lazyConnect).toBe(false);
    });
  });
});
