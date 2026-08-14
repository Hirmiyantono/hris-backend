// Jest setup file to prevent real database and Redis connections during tests

// Mock ioredis globally to prevent real Redis connections
jest.mock('ioredis', () => {
  const mockRedisInstance = {
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    ping: jest.fn(),
    info: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    status: 'ready',
  };

  return jest.fn(() => mockRedisInstance);
});

// Mock BullMQ to prevent real Redis connections during tests (Task 1.5)
jest.mock('bullmq', () => {
  const mockJob = {
    id: 'mock-job-id',
    name: 'mock-job',
    data: {},
    opts: { attempts: 3 },
    attemptsMade: 0,
    timestamp: Date.now(),
    progress: 0,
    returnvalue: undefined,
    failedReason: undefined,
    processedOn: undefined,
    finishedOn: undefined,
    getState: jest.fn().mockResolvedValue('waiting'),
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue(mockJob),
    getJob: jest.fn().mockResolvedValue(mockJob),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    isPaused: jest.fn().mockResolvedValue(false),
    removeRepeatable: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    client: { status: 'ready' },
  };

  return {
    Queue: jest.fn(() => mockQueue),
    Worker: jest.fn(),
    QueueScheduler: jest.fn(),
  };
});

// Prevent actual .env file loading in tests
process.env.NODE_ENV = 'test';
