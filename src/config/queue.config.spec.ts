import { ConfigService } from '@nestjs/config';
import { getQueueConfigs } from './queue.config';
import { QueueType } from '../modules/queue/interfaces/queue-types.enum';

describe('Queue Configuration', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      QUEUE_PAYROLL_CONCURRENCY: 5,
      QUEUE_NOTIFICATION_CONCURRENCY: 15,
      QUEUE_REPORT_CONCURRENCY: 4,
      QUEUE_MAINTENANCE_CONCURRENCY: 2,
    });
  });

  describe('getQueueConfigs', () => {
    it('should return configurations for all queue types', () => {
      const configs = getQueueConfigs(configService);

      expect(configs).toBeDefined();
      expect(configs[QueueType.PAYROLL]).toBeDefined();
      expect(configs[QueueType.NOTIFICATION]).toBeDefined();
      expect(configs[QueueType.REPORT]).toBeDefined();
      expect(configs[QueueType.MAINTENANCE]).toBeDefined();
    });

    it('should have correct exponential backoff configuration', () => {
      const configs = getQueueConfigs(configService);
      const payrollConfig = configs[QueueType.PAYROLL];

      expect(payrollConfig.defaultJobOptions.attempts).toBe(3);
      expect(payrollConfig.defaultJobOptions.backoff.type).toBe('exponential');
      expect(payrollConfig.defaultJobOptions.backoff.delay).toBe(5000);
    });

    it('should apply environment variable overrides for concurrency', () => {
      const configs = getQueueConfigs(configService);

      expect(configs[QueueType.PAYROLL].concurrency).toBe(5);
      expect(configs[QueueType.NOTIFICATION].concurrency).toBe(15);
      expect(configs[QueueType.REPORT].concurrency).toBe(4);
      expect(configs[QueueType.MAINTENANCE].concurrency).toBe(2);
    });

    it('should use default concurrency values when env vars not set', () => {
      const defaultConfigService = new ConfigService({});
      const configs = getQueueConfigs(defaultConfigService);

      expect(configs[QueueType.PAYROLL].concurrency).toBe(2);
      expect(configs[QueueType.NOTIFICATION].concurrency).toBe(10);
      expect(configs[QueueType.REPORT].concurrency).toBe(3);
      expect(configs[QueueType.MAINTENANCE].concurrency).toBe(1);
    });

    it('should have correct retry delays for each queue type', () => {
      const configs = getQueueConfigs(configService);

      // Payroll: 5000ms initial delay (10s, 20s retry schedule)
      expect(configs[QueueType.PAYROLL].defaultJobOptions.backoff.delay).toBe(5000);

      // Notification: 2000ms initial delay (4s, 8s retry schedule)
      expect(configs[QueueType.NOTIFICATION].defaultJobOptions.backoff.delay).toBe(2000);

      // Report: 10000ms initial delay (20s retry schedule, only 2 attempts)
      expect(configs[QueueType.REPORT].defaultJobOptions.backoff.delay).toBe(10000);
      expect(configs[QueueType.REPORT].defaultJobOptions.attempts).toBe(2);

      // Maintenance: 5000ms initial delay (10s, 20s retry schedule)
      expect(configs[QueueType.MAINTENANCE].defaultJobOptions.backoff.delay).toBe(5000);
    });

    it('should have correct priorities', () => {
      const configs = getQueueConfigs(configService);

      expect(configs[QueueType.PAYROLL].priority).toBe(10); // Highest
      expect(configs[QueueType.NOTIFICATION].priority).toBe(7);
      expect(configs[QueueType.MAINTENANCE].priority).toBe(5);
      expect(configs[QueueType.REPORT].priority).toBe(3); // Lowest
    });

    it('should have correct timeouts', () => {
      const configs = getQueueConfigs(configService);

      expect(configs[QueueType.PAYROLL].defaultJobOptions.timeout).toBe(1800000); // 30 min
      expect(configs[QueueType.NOTIFICATION].defaultJobOptions.timeout).toBe(60000); // 1 min
      expect(configs[QueueType.REPORT].defaultJobOptions.timeout).toBe(3600000); // 60 min
      expect(configs[QueueType.MAINTENANCE].defaultJobOptions.timeout).toBe(600000); // 10 min
    });

    it('should have correct job retention settings', () => {
      const configs = getQueueConfigs(configService);

      // Payroll
      expect(configs[QueueType.PAYROLL].defaultJobOptions.removeOnComplete).toBe(100);
      expect(configs[QueueType.PAYROLL].defaultJobOptions.removeOnFail).toBe(500);

      // Report (different settings)
      expect(configs[QueueType.REPORT].defaultJobOptions.removeOnComplete).toBe(50);
      expect(configs[QueueType.REPORT].defaultJobOptions.removeOnFail).toBe(200);
    });
  });
});
