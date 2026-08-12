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

// Prevent actual .env file loading in tests
process.env.NODE_ENV = 'test';
