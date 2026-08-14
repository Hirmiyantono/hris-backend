# Task 1.5 Implementation Plan: BullMQ Background Job Processing Infrastructure

## Executive Summary

Task 1.5 establishes the enterprise-ready background job processing foundation using BullMQ with the existing Redis infrastructure from Task 1.4. This implementation provides a reusable queue infrastructure that future modules (payroll, notifications, reports) can consume without implementing BullMQ or payroll business logic itself.

## Requirements Traceability

### Primary Requirement
- **Requirement 32: Background Job Processing**
  - 32.1: Queue jobs for background processing using BullMQ
  - 32.2: Return job identifier to requester
  - 32.3: Allow job status polling using job identifier
  - 32.4: Send notification when job completes successfully
  - 32.5: Implement retry logic with exponential backoff (up to 3 attempts)
  - 32.6: Send error notification after all retries fail
  - 32.7: Support scheduled jobs for recurring tasks (leave accrual, report generation)

### Supporting Requirements
- **Requirement 5**: Session management (Redis reuse)
- **Requirement 27**: Caching infrastructure (Redis reuse)

## Design Sections Used

### From design.md:
- **Background Job Processing** (lines 2274-2400)
  - Queue Architecture with 4 queue types (Payroll, Notification, Report, Maintenance)
  - Job Configuration with retry strategy and exponential backoff
  - Job Scheduling with cron patterns
  - Job Monitoring with status tracking and events
- **Caching Strategy** (Redis connection reuse)
- **Error Handling** (Graceful degradation patterns)

### Architecture Baseline:
- Modular monolith (microservices-ready)
- NestJS dependency injection
- Strict TypeScript
- Environment-based configuration

## Scope Definition

### In Scope ✅
1. Install BullMQ dependency
2. Create QueueModule as reusable infrastructure
3. Implement generic Queue service/factory
4. Define 4 queue types (Payroll, Notification, Report, Maintenance)
5. Implement retry strategy with exponential backoff (3 attempts, starting at 5 seconds)
6. Configure job timeout strategy
7. Configure job concurrency
8. Configure job priority levels
9. Implement graceful shutdown for queues/workers
10. Reuse existing Redis connection configuration
11. Implement health check endpoint for queue infrastructure (`/health/queues`)
12. Add queue-related environment variables
13. Implement job status polling API (`GET /jobs/:jobId`)
14. Configure job retention (100 completed, 500 failed)
15. Add comprehensive logging for job lifecycle
16. Unit tests for queue infrastructure
17. Integration tests for job execution (with mocks)
18. Document queue usage patterns for future modules

### Out of Scope ❌
1. NO payroll business logic implementation (Task 2.x+)
2. NO authentication/JWT implementation (Task 2.x)
3. NO notification service implementation (Later task)
4. NO report generation logic (Later task)
5. NO leave accrual logic (Later task)
6. NO email sending implementation (Later task)
7. NO actual worker processor implementations (only infrastructure)
8. NO frontend modifications
9. NO database migrations (no new entities yet)
10. NO modification to requirements.md, design.md, or tasks.md

### Boundary Clarification
- This task provides the **plumbing** for background jobs
- Future tasks will **consume** this infrastructure by:
  - Importing QueueModule
  - Injecting QueueService
  - Adding jobs to appropriate queues
  - Implementing worker processors

## Dependencies

### New Dependencies to Add
```json
{
  "dependencies": {
    "bullmq": "^5.0.0"
  },
  "devDependencies": {
    "@types/bullmq": "^5.0.0"  // If available
  }
}
```

### Version Compatibility
- BullMQ 5.x: Compatible with ioredis 5.x (already installed in Task 1.4)
- BullMQ 5.x: Requires Redis 6.x+ (documented as requirement)
- NestJS 10.x: Fully compatible with BullMQ 5.x

### Dependency Reuse
- **ioredis**: Already installed (Task 1.4) - version 5.3.2
- **Redis configuration**: Reuse `getRedisConfig()` from `src/config/redis.config.ts`
- **ConfigService**: Already available globally
- **CacheService**: Available but separate from queue infrastructure

## Architecture Design

### Module Structure
```
src/
├── modules/
│   └── queue/
│       ├── queue.module.ts           # QueueModule with queue definitions
│       ├── queue.service.ts          # Generic queue operations service
│       ├── queue-config.service.ts   # Queue configuration provider
│       ├── queue.health.ts           # Health indicator for queues
│       ├── interfaces/
│       │   ├── queue-config.interface.ts
│       │   ├── job-status.interface.ts
│       │   └── queue-types.enum.ts
│       ├── dto/
│       │   └── job-status.dto.ts
│       └── queue.service.spec.ts
├── config/
│   └── queue.config.ts               # Queue configuration factory
└── app.controller.ts                 # Add /health/queues and /jobs/:jobId
```

### Queue Type Definitions
Based on design.md section "Background Job Processing":

```typescript
export enum QueueType {
  PAYROLL = 'payroll',           // High-priority, resource-intensive
  NOTIFICATION = 'notification', // Medium-priority, email/notifications
  REPORT = 'report',            // Low-priority, report generation
  MAINTENANCE = 'maintenance'   // Scheduled maintenance (leave accrual, cleanup)
}

export interface QueueConfig {
  name: QueueType;
  priority: number;              // 1 (lowest) to 10 (highest)
  concurrency: number;           // Max concurrent jobs
  rateLimit: {
    max: number;                 // Max jobs per duration
    duration: number;            // Duration in milliseconds
  };
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: 'exponential';
      delay: number;             // Initial delay in ms
    };
    timeout: number;             // Job timeout in ms
    removeOnComplete: number;    // Keep N completed jobs
    removeOnFail: number;        // Keep N failed jobs
    priority?: number;
  };
}
```

### Queue Configurations

#### Payroll Queue (High Priority)
```typescript
{
  name: QueueType.PAYROLL,
  priority: 10,
  concurrency: 2,                // Max 2 payroll jobs simultaneously
  rateLimit: { max: 10, duration: 60000 }, // Max 10 jobs per minute
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }, // 5s, 25s, 125s
    timeout: 1800000,            // 30 minutes
    removeOnComplete: 100,
    removeOnFail: 500,
    priority: 1                  // Highest within queue
  }
}
```

#### Notification Queue (Medium Priority)
```typescript
{
  name: QueueType.NOTIFICATION,
  priority: 7,
  concurrency: 10,               // Max 10 notification jobs simultaneously
  rateLimit: { max: 100, duration: 60000 }, // Max 100 jobs per minute
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 10s, 50s
    timeout: 60000,              // 1 minute
    removeOnComplete: 100,
    removeOnFail: 500,
    priority: 5                  // Medium within queue
  }
}
```

#### Report Queue (Low Priority)
```typescript
{
  name: QueueType.REPORT,
  priority: 3,
  concurrency: 3,                // Max 3 report jobs simultaneously
  rateLimit: { max: 20, duration: 60000 }, // Max 20 jobs per minute
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 }, // 10s, 100s
    timeout: 3600000,            // 60 minutes
    removeOnComplete: 50,
    removeOnFail: 200,
    priority: 10                 // Lowest within queue
  }
}
```

#### Maintenance Queue (Scheduled)
```typescript
{
  name: QueueType.MAINTENANCE,
  priority: 5,
  concurrency: 1,                // Sequential execution
  rateLimit: { max: 10, duration: 60000 }, // Max 10 jobs per minute
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }, // 5s, 25s, 125s
    timeout: 600000,             // 10 minutes
    removeOnComplete: 100,
    removeOnFail: 500,
    priority: 5                  // Medium within queue
  }
}
```

### Redis Connection Reuse Strategy

**Approach**: Create new Redis connection for BullMQ using the same configuration factory

**Rationale**:
1. BullMQ requires a dedicated Redis connection (separate from CacheService)
2. BullMQ uses Redis pub/sub and blocking operations incompatible with shared connection
3. Reuse `getRedisConfig()` factory to ensure consistent configuration
4. Both connections use the same Redis instance/cluster but different connection objects

**Implementation**:
```typescript
// In queue-config.service.ts
constructor(private configService: ConfigService) {
  // Reuse the same config factory from Task 1.4
  const redisOptions = getRedisConfig(this.configService);
  
  // Create BullMQ-specific connection
  this.redisConnection = {
    host: redisOptions.host,
    port: redisOptions.port,
    password: redisOptions.password,
    db: redisOptions.db,
    maxRetriesPerRequest: null,  // BullMQ requirement
    enableReadyCheck: false       // BullMQ recommendation
  };
}
```

### QueueService API

```typescript
export class QueueService {
  // Add job to queue
  async addJob<T>(
    queueType: QueueType,
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>>;

  // Get job status
  async getJobStatus(jobId: string): Promise<JobStatus>;

  // Get job by ID
  async getJob(jobId: string): Promise<Job | null>;

  // Add repeatable/scheduled job
  async addRepeatable<T>(
    queueType: QueueType,
    jobName: string,
    data: T,
    repeat: RepeatOptions
  ): Promise<Job<T>>;

  // Remove repeatable job
  async removeRepeatable(
    queueType: QueueType,
    jobName: string,
    repeatId: string
  ): Promise<void>;

  // Get queue health
  async getQueueHealth(queueType: QueueType): Promise<QueueHealth>;

  // Get all queue metrics
  async getAllQueueMetrics(): Promise<QueueMetrics[]>;
}
```

### Job Status Interface

```typescript
export interface JobStatus {
  jobId: string;
  queue: QueueType;
  name: string;
  state: JobState;            // 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
  progress: number;           // 0-100
  data: unknown;
  result?: unknown;
  failedReason?: string;
  attemptsMade: number;
  attemptsTotal: number;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
}
```

### Queue Health Interface

```typescript
export interface QueueHealth {
  name: QueueType;
  isHealthy: boolean;
  connection: 'connected' | 'disconnected';
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  workers: number;
}
```

## Retry Strategy Implementation

### Exponential Backoff Configuration
Based on design.md and Requirement 32.5:

```typescript
{
  attempts: 3,                    // Try 3 times total (1 initial + 2 retries)
  backoff: {
    type: 'exponential',
    delay: 5000                   // Initial delay: 5 seconds
  }
}

// Retry schedule:
// Attempt 1: Immediate execution
// Attempt 2: Wait 5 seconds (5000ms)
// Attempt 3: Wait 25 seconds (5000 * 5 = 25000ms)
// Attempt 4: Wait 125 seconds (25000 * 5 = 125000ms) - Not executed due to attempts: 3
```

### Retry Logic Flow
1. Job fails on attempt 1
2. BullMQ calculates delay: `delay * (attempt ^ 2)` (exponential backoff)
3. Job moves to 'delayed' state
4. After delay expires, job moves back to 'waiting' state
5. Worker picks up job for retry
6. Repeat until `attempts` exhausted
7. If all attempts fail: job moves to 'failed' state permanently

### Failed Job Handling
```typescript
// In QueueModule setup
queue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts`, {
    jobId: job.id,
    queueName: job.queueName,
    error: error.message,
    data: job.data
  });
  
  // Future integration point for Requirement 32.6 (notification)
  // notificationService.sendJobFailedNotification(job, error);
});
```

## Job Timeout Strategy

### Timeout Configuration by Queue Type
- **Payroll**: 30 minutes (1,800,000ms) - large batch processing
- **Notification**: 1 minute (60,000ms) - fast delivery
- **Report**: 60 minutes (3,600,000ms) - complex report generation
- **Maintenance**: 10 minutes (600,000ms) - routine tasks

### Timeout Behavior
1. Job exceeds timeout duration
2. BullMQ sends SIGTERM to worker process
3. Worker has 5 seconds grace period to cleanup
4. If worker doesn't exit: BullMQ sends SIGKILL
5. Job marked as 'failed' with timeout error
6. Retry logic applies (if attempts remaining)

## Job Concurrency Strategy

### Concurrency Limits by Queue Type
- **Payroll**: 2 concurrent jobs (resource-intensive)
- **Notification**: 10 concurrent jobs (I/O-bound)
- **Report**: 3 concurrent jobs (CPU/memory-intensive)
- **Maintenance**: 1 concurrent job (sequential execution)

### Implementation
```typescript
// In worker processor (future task implementation)
const worker = new Worker(
  QueueType.PAYROLL,
  async (job) => { /* processor logic */ },
  {
    connection: redisConnection,
    concurrency: 2  // Max 2 jobs in parallel
  }
);
```

## Job Priority Strategy

### Priority Levels
- **Queue-level priority**: Determines which queue to process first (1-10)
  - Payroll: 10 (highest)
  - Notification: 7 (medium-high)
  - Maintenance: 5 (medium)
  - Report: 3 (low)

- **Job-level priority**: Within same queue (1-100, lower = higher priority)
  - Payroll (urgent): 1
  - Payroll (normal): 5
  - Report (executive): 1
  - Report (standard): 10

### Implementation
```typescript
// Adding high-priority job
await queueService.addJob(
  QueueType.PAYROLL,
  'execute-payroll',
  { companyId: '123', periodId: '2024-01' },
  { priority: 1 }  // Highest priority within payroll queue
);
```

## Idempotency Considerations

### Job Deduplication Strategy
```typescript
// Add job with unique ID to prevent duplicates
await queueService.addJob(
  QueueType.PAYROLL,
  'execute-payroll',
  { companyId: '123', periodId: '2024-01' },
  {
    jobId: `payroll-123-2024-01`,  // Unique job ID
    removeOnComplete: true,
    removeOnFail: false
  }
);

// BullMQ prevents duplicate jobs with same jobId automatically
// Second addJob() with same jobId returns existing job
```

### Idempotent Job Design Guidelines
Document for future implementers:
1. Design job processors to be idempotent (safe to retry)
2. Check if work already completed before processing
3. Use database transactions for atomic operations
4. Store job completion status in database
5. Validate preconditions before execution

## Graceful Shutdown Strategy

### Shutdown Sequence
```typescript
// In QueueService.onModuleDestroy()
async onModuleDestroy(): Promise<void> {
  this.logger.log('Initiating graceful shutdown for all queues...');
  
  // 1. Stop accepting new jobs
  await Promise.all(
    Array.from(this.queues.values()).map(queue => queue.pause())
  );
  
  // 2. Wait for active jobs to complete (max 30 seconds)
  const timeout = 30000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const activeJobs = await this.getActiveJobsCount();
    if (activeJobs === 0) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 3. Close queue connections
  await Promise.all(
    Array.from(this.queues.values()).map(queue => queue.close())
  );
  
  this.logger.log('All queues closed successfully');
}
```

### NestJS Shutdown Hooks
```typescript
// In main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable graceful shutdown
  app.enableShutdownHooks();
  
  // Handle SIGTERM
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully');
    await app.close();
  });
  
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully');
    await app.close();
  });
  
  await app.listen(3000);
}
```

## Logging and Observability

### Log Events
```typescript
// Queue-level events
queue.on('error', (error) => {
  logger.error(`Queue ${queueName} error:`, error);
});

queue.on('waiting', (job) => {
  logger.debug(`Job ${job.id} waiting in ${queueName}`);
});

queue.on('active', (job) => {
  logger.log(`Job ${job.id} started in ${queueName}`);
});

queue.on('completed', (job, result) => {
  logger.log(`Job ${job.id} completed in ${queueName}`, { result });
});

queue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed in ${queueName}`, { 
    error: error.message,
    attemptsMade: job.attemptsMade 
  });
});

queue.on('progress', (job, progress) => {
  logger.debug(`Job ${job.id} progress: ${progress}%`);
});

queue.on('stalled', (jobId) => {
  logger.warn(`Job ${jobId} stalled in ${queueName}`);
});
```

### Metrics Collection
```typescript
export interface QueueMetrics {
  queue: QueueType;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  isPaused: boolean;
}
```

## Health Check Implementation

### Endpoint: `GET /health/queues`

**Response Structure**:
```typescript
{
  "status": "healthy" | "degraded" | "unhealthy",
  "queues": [
    {
      "name": "payroll",
      "isHealthy": true,
      "connection": "connected",
      "counts": {
        "waiting": 5,
        "active": 2,
        "completed": 1523,
        "failed": 12,
        "delayed": 0
      },
      "workers": 2
    },
    // ... other queues
  ],
  "timestamp": "2026-08-14T23:45:00.000Z"
}
```

**Health Criteria**:
- **Healthy**: All queues connected, no stalled jobs, failed rate < 5%
- **Degraded**: Some queues connected, failed rate 5-10%
- **Unhealthy**: Queues disconnected OR failed rate > 10%

### Implementation
```typescript
@Get('health/queues')
async getQueuesHealth(): Promise<QueuesHealthResponse> {
  return this.queueService.getAllQueueMetrics();
}
```

## Job Status Polling API

### Endpoint: `GET /jobs/:jobId`

**Response Structure**:
```typescript
{
  "jobId": "payroll-123-2024-01",
  "queue": "payroll",
  "name": "execute-payroll",
  "state": "active",
  "progress": 45,
  "data": { "companyId": "123", "periodId": "2024-01" },
  "attemptsMade": 1,
  "attemptsTotal": 3,
  "createdAt": "2026-08-14T23:30:00.000Z",
  "processedAt": "2026-08-14T23:30:15.000Z"
}
```

**State Values**:
- `waiting`: Job queued, not started
- `active`: Job currently processing
- `completed`: Job finished successfully
- `failed`: Job failed after all retries
- `delayed`: Job waiting for retry
- `unknown`: Job not found

### Implementation
```typescript
@Get('jobs/:jobId')
async getJobStatus(@Param('jobId') jobId: string): Promise<JobStatus> {
  return this.queueService.getJobStatus(jobId);
}
```

## Environment Configuration

### New Environment Variables
```bash
# Queue Configuration (optional - use defaults if not set)
QUEUE_REDIS_HOST=localhost          # Default: Use REDIS_HOST
QUEUE_REDIS_PORT=6379               # Default: Use REDIS_PORT
QUEUE_REDIS_PASSWORD=               # Default: Use REDIS_PASSWORD
QUEUE_REDIS_DB=1                    # Default: Use REDIS_DB (separate DB recommended)

# Queue Performance Tuning (optional)
QUEUE_PAYROLL_CONCURRENCY=2         # Default: 2
QUEUE_NOTIFICATION_CONCURRENCY=10   # Default: 10
QUEUE_REPORT_CONCURRENCY=3          # Default: 3
QUEUE_MAINTENANCE_CONCURRENCY=1     # Default: 1
```

### Environment Validation
Update `src/config/env.validation.ts`:
```typescript
export class EnvironmentVariables {
  // ... existing fields ...

  @IsString()
  @IsOptional()
  QUEUE_REDIS_HOST?: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  QUEUE_REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  QUEUE_REDIS_PASSWORD?: string;

  @IsNumber()
  @Min(0)
  @Max(15)
  @IsOptional()
  QUEUE_REDIS_DB?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  QUEUE_PAYROLL_CONCURRENCY?: number = 2;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  QUEUE_NOTIFICATION_CONCURRENCY?: number = 10;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  QUEUE_REPORT_CONCURRENCY?: number = 3;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  QUEUE_MAINTENANCE_CONCURRENCY?: number = 1;
}
```

## Testing Strategy

### Unit Tests

#### QueueService Unit Tests (`queue.service.spec.ts`)
```typescript
describe('QueueService', () => {
  let service: QueueService;
  let mockQueue: jest.Mocked<Queue>;
  
  beforeEach(() => {
    // Mock BullMQ Queue
    mockQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
      pause: jest.fn(),
      close: jest.fn(),
      // ... other methods
    } as any;
  });

  describe('addJob', () => {
    it('should add job to correct queue', async () => {
      const jobData = { companyId: '123' };
      await service.addJob(QueueType.PAYROLL, 'test-job', jobData);
      
      expect(mockQueue.add).toHaveBeenCalledWith(
        'test-job',
        jobData,
        expect.any(Object)
      );
    });

    it('should apply custom job options', async () => {
      await service.addJob(
        QueueType.PAYROLL,
        'test-job',
        {},
        { priority: 1, delay: 5000 }
      );
      
      expect(mockQueue.add).toHaveBeenCalledWith(
        'test-job',
        {},
        expect.objectContaining({ priority: 1, delay: 5000 })
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for existing job', async () => {
      const mockJob = {
        id: 'job-123',
        name: 'test-job',
        queueName: QueueType.PAYROLL,
        data: { test: 'data' },
        getState: jest.fn().mockResolvedValue('completed'),
        progress: 100,
        attemptsMade: 1,
        opts: { attempts: 3 },
        timestamp: Date.now(),
      };
      
      mockQueue.getJob.mockResolvedValue(mockJob as any);
      
      const status = await service.getJobStatus('job-123');
      
      expect(status.state).toBe('completed');
      expect(status.progress).toBe(100);
    });

    it('should return unknown state for non-existent job', async () => {
      mockQueue.getJob.mockResolvedValue(null);
      
      const status = await service.getJobStatus('non-existent');
      
      expect(status.state).toBe('unknown');
    });
  });

  describe('graceful shutdown', () => {
    it('should pause and close all queues', async () => {
      await service.onModuleDestroy();
      
      expect(mockQueue.pause).toHaveBeenCalled();
      expect(mockQueue.close).toHaveBeenCalled();
    });
  });
});
```

#### QueueConfigService Unit Tests
```typescript
describe('QueueConfigService', () => {
  it('should create queue configurations with correct defaults', () => {
    const config = service.getQueueConfig(QueueType.PAYROLL);
    
    expect(config.defaultJobOptions.attempts).toBe(3);
    expect(config.defaultJobOptions.backoff.type).toBe('exponential');
    expect(config.defaultJobOptions.backoff.delay).toBe(5000);
  });

  it('should apply environment variable overrides', () => {
    process.env.QUEUE_PAYROLL_CONCURRENCY = '5';
    
    const config = service.getQueueConfig(QueueType.PAYROLL);
    
    expect(config.concurrency).toBe(5);
  });

  it('should reuse Redis configuration from Task 1.4', () => {
    const redisConfig = service.getRedisConnectionOptions();
    
    expect(redisConfig.host).toBeDefined();
    expect(redisConfig.port).toBeDefined();
  });
});
```

### Integration Tests

#### Job Lifecycle Integration Test
```typescript
describe('Queue Integration', () => {
  let app: INestApplication;
  let queueService: QueueService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [QueueModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    
    queueService = module.get<QueueService>(QueueService);
  });

  it('should complete full job lifecycle', async () => {
    // Add job
    const job = await queueService.addJob(
      QueueType.PAYROLL,
      'test-job',
      { data: 'test' }
    );

    expect(job.id).toBeDefined();

    // Poll status
    const status = await queueService.getJobStatus(job.id!);
    expect(status.state).toMatch(/waiting|active|completed/);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

#### Retry Logic Test
```typescript
describe('Queue Retry Logic', () => {
  it('should retry failed job with exponential backoff', async () => {
    const attempts: number[] = [];
    
    // Mock worker that fails twice, succeeds third time
    const worker = new Worker(
      QueueType.NOTIFICATION,
      async (job) => {
        attempts.push(job.attemptsMade);
        
        if (job.attemptsMade < 3) {
          throw new Error('Simulated failure');
        }
        
        return { success: true };
      },
      { connection: mockRedisConnection }
    );

    // Add job
    await queueService.addJob(QueueType.NOTIFICATION, 'retry-test', {});

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 40000)); // Wait for retries

    expect(attempts).toEqual([1, 2, 3]);
    
    await worker.close();
  });
});
```

### Mock Strategy for Unit Tests

```typescript
// test/mocks/queue.mock.ts
export const mockQueue = () => ({
  add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  getJob: jest.fn(),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  getJobCounts: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
  }),
});

// test/jest-setup.ts (update for Task 1.5)
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => mockQueue()),
  Worker: jest.fn(),
  QueueScheduler: jest.fn(),
}));
```

## Files to Create

### Core Infrastructure
1. `src/modules/queue/queue.module.ts` - Main module definition
2. `src/modules/queue/queue.service.ts` - Queue operations service
3. `src/modules/queue/queue-config.service.ts` - Configuration provider
4. `src/modules/queue/queue.health.ts` - Health indicator
5. `src/config/queue.config.ts` - Queue configuration factory

### Interfaces
6. `src/modules/queue/interfaces/queue-config.interface.ts` - Configuration interfaces
7. `src/modules/queue/interfaces/job-status.interface.ts` - Job status interfaces
8. `src/modules/queue/interfaces/queue-types.enum.ts` - Queue type enum
9. `src/modules/queue/interfaces/queue-health.interface.ts` - Health interfaces

### DTOs
10. `src/modules/queue/dto/job-status.dto.ts` - Job status response DTO
11. `src/modules/queue/dto/queue-health.dto.ts` - Queue health response DTO

### Tests
12. `src/modules/queue/queue.service.spec.ts` - QueueService unit tests
13. `src/modules/queue/queue-config.service.spec.ts` - QueueConfigService unit tests
14. `src/config/queue.config.spec.ts` - Queue config unit tests
15. `test/mocks/queue.mock.ts` - Mock utilities for tests

### Documentation
16. `src/modules/queue/README.md` - Queue usage documentation

## Files to Modify

1. **`package.json`**
   - Add `bullmq: ^5.0.0` dependency

2. **`src/app.module.ts`**
   - Import `QueueModule`

3. **`src/app.controller.ts`**
   - Add `GET /health/queues` endpoint
   - Add `GET /jobs/:jobId` endpoint

4. **`src/app.controller.spec.ts`**
   - Add tests for new queue endpoints

5. **`src/config/env.validation.ts`**
   - Add queue-related environment variable validation

6. **`.env.example`**
   - Add queue configuration variables

7. **`backend/README.md`**
   - Update with BullMQ configuration section
   - Add queue usage examples

8. **`test/jest-setup.ts`**
   - Add BullMQ mock setup

9. **`src/main.ts`**
   - Add graceful shutdown hooks (if not already present)

## Acceptance Criteria Checklist

Based on Task 1.5 in tasks.md:

- [ ] **Configure BullMQ with Redis connection**
  - [ ] Install BullMQ dependency
  - [ ] Reuse Redis configuration from Task 1.4
  - [ ] Create separate Redis connection for queues
  - [ ] Verify connection on application startup

- [ ] **Create job queue infrastructure**
  - [ ] Define 4 queue types (Payroll, Notification, Report, Maintenance)
  - [ ] Implement QueueModule with dependency injection
  - [ ] Implement QueueService for job operations
  - [ ] Configure queue-specific options (concurrency, rate limits)

- [ ] **Implement job monitoring endpoints**
  - [ ] Implement `GET /health/queues` health check
  - [ ] Implement `GET /jobs/:jobId` status polling
  - [ ] Return job state, progress, attempts
  - [ ] Include queue metrics (waiting, active, completed, failed)

- [ ] **Configure exponential backoff retry strategy for failed jobs**
  - [ ] Set attempts to 3 (Requirement 32.5)
  - [ ] Configure exponential backoff (initial delay 5s)
  - [ ] Log retry attempts
  - [ ] Move to failed state after all retries exhausted

- [ ] **Set up scheduled/cron job support with BullMQ repeat options**
  - [ ] Implement `addRepeatable()` method
  - [ ] Support cron pattern configuration
  - [ ] Support timezone configuration
  - [ ] Document usage for future scheduled jobs

### Additional Acceptance Criteria (from Requirement 32)

- [ ] **32.1**: Jobs queued for background processing ✓ (via addJob)
- [ ] **32.2**: Return job identifier ✓ (Job.id returned)
- [ ] **32.3**: Allow job status polling ✓ (GET /jobs/:jobId)
- [ ] **32.4**: Notification on success ⚠️ (Event hook provided, actual notification in future task)
- [ ] **32.5**: Retry with exponential backoff (3 attempts) ✓
- [ ] **32.6**: Error notification after all retries ⚠️ (Event hook provided, actual notification in future task)
- [ ] **32.7**: Support scheduled jobs ✓ (Repeat options implemented)

**Note**: 32.4 and 32.6 require NotificationService (future task). This task provides event hooks (`queue.on('completed')`, `queue.on('failed')`) with clear integration points documented.

## Implementation Constraints

### Must Follow
1. Use existing Redis configuration factory from Task 1.4
2. Do NOT implement worker processors (only infrastructure)
3. Do NOT implement payroll business logic
4. Do NOT implement notification delivery
5. Follow strict TypeScript (no unnecessary `any`)
6. Use NestJS dependency injection patterns
7. Implement OnModuleDestroy for graceful shutdown
8. Use ConfigService for environment variables

### Must NOT Do
1. Modify requirements.md, design.md, or tasks.md
2. Implement authentication/authorization logic
3. Create database migrations (no entities yet)
4. Modify frontend code
5. Install Redis server or Docker
6. Hardcode configuration values
7. Create shared Redis connection (must be separate)

## Validation Strategy

### Pre-Implementation Validation
1. Verify BullMQ version compatibility with ioredis
2. Verify NestJS version supports BullMQ patterns
3. Review Task 1.4 Redis configuration for reuse

### Implementation Validation
After each major component:
1. Run `npm run typecheck` - Verify TypeScript compilation
2. Run `npm run lint` - Verify ESLint passes
3. Run unit tests for that component
4. Verify no new ESLint errors introduced

### Post-Implementation Validation
Run full validation suite:

```bash
# 1. TypeScript compilation
npm run typecheck

# 2. Linting
npm run lint

# 3. Unit tests
npm test

# 4. Build
npm run build

# 5. Prettier
npx prettier --check "src/**/*.ts" "test/**/*.ts"
```

### Validation Success Criteria
- All commands exit with code 0
- No TypeScript errors
- No ESLint errors
- All unit tests pass (existing + new)
- Code coverage maintained or improved
- Build produces dist/ directory successfully

### Redis Connectivity
- Unit tests: MUST NOT require real Redis (use mocks)
- Integration tests: Document Redis requirement clearly
- Health check: Return proper error if Redis unavailable
- Report status: UNVERIFIED if Redis not running (not a blocker)

## Risks and Mitigations

### Risk 1: Redis Connection Conflicts
**Description**: BullMQ and CacheService might interfere if sharing connection

**Mitigation**:
- Create separate Redis connection for BullMQ
- Use different Redis DB number (QUEUE_REDIS_DB=1 vs REDIS_DB=0)
- Reuse configuration factory, not connection instance
- Document connection strategy clearly

### Risk 2: Test Timeout Issues
**Description**: Async job processing might cause test timeouts

**Mitigation**:
- Mock BullMQ in unit tests (no real queue)
- Use short timeouts in integration tests
- Clear all jobs in afterEach hooks
- Use `forceExit: true` in Jest config (already present from Task 1.4)

### Risk 3: Memory Leaks from Unclosed Queues
**Description**: Queue connections might not close properly

**Mitigation**:
- Implement OnModuleDestroy lifecycle hook
- Close all queues in graceful shutdown
- Add timeout for shutdown (max 30 seconds)
- Test shutdown behavior explicitly

### Risk 4: No Worker Processors Yet
**Description**: Jobs added but no workers to process them

**Mitigation**:
- Document clearly: "Infrastructure only, workers in future tasks"
- Provide example worker in README
- Log warning if job sits in 'waiting' too long
- Create clear integration points for future tasks

### Risk 5: BullMQ Version Compatibility
**Description**: BullMQ 5.x has breaking changes from 4.x

**Mitigation**:
- Use BullMQ 5.x (latest, best compatibility with ioredis 5.x)
- Reference official BullMQ documentation
- Test with existing ioredis version (5.3.2)
- Document version requirements clearly

## Integration Points for Future Tasks

### For Task 2.x+ (Payroll Implementation)
```typescript
// Future payroll service will inject QueueService
import { QueueService, QueueType } from '../queue/queue.service';

@Injectable()
export class PayrollService {
  constructor(private queueService: QueueService) {}

  async executePayroll(companyId: string, periodId: string): Promise<string> {
    // Add job to payroll queue
    const job = await this.queueService.addJob(
      QueueType.PAYROLL,
      'execute-payroll',
      { companyId, periodId },
      { jobId: `payroll-${companyId}-${periodId}` }
    );

    return job.id!; // Return job ID for status polling
  }
}
```

### For Worker Implementation (Future Task)
```typescript
// Future task will create worker processors
import { Worker } from 'bullmq';
import { QueueType } from './queue/interfaces/queue-types.enum';

const payrollWorker = new Worker(
  QueueType.PAYROLL,
  async (job) => {
    // Implement payroll calculation logic
    const { companyId, periodId } = job.data;
    
    await job.updateProgress(10);
    // ... payroll logic ...
    await job.updateProgress(100);
    
    return { success: true, employeesProcessed: 150 };
  },
  {
    connection: redisConnection,
    concurrency: 2
  }
);
```

### For Notification Integration (Future Task)
```typescript
// Queue event listeners already set up
queue.on('completed', (job, result) => {
  // Future: Call NotificationService
  await notificationService.send({
    userId: job.data.requestedBy,
    type: 'job_completed',
    data: { jobId: job.id, result }
  });
});
```

## Documentation Requirements

### In-Code Documentation
- JSDoc comments for all public methods
- Explain retry strategy in comments
- Document queue configuration rationale
- Add usage examples in method comments

### README Documentation
Update `backend/README.md`:
```markdown
## Background Jobs (BullMQ)

### Queue Types
- **Payroll**: High-priority payroll calculations (30min timeout)
- **Notification**: Email and notification delivery (1min timeout)
- **Report**: Report generation (60min timeout)
- **Maintenance**: Scheduled maintenance tasks (10min timeout)

### Usage Example
```typescript
// Add job to queue
const job = await queueService.addJob(
  QueueType.PAYROLL,
  'job-name',
  { data: 'value' }
);

// Check job status
const status = await queueService.getJobStatus(job.id);
```

### Monitoring
- Health check: `GET /health/queues`
- Job status: `GET /jobs/:jobId`
```

### Module-Specific README
Create `src/modules/queue/README.md` with:
- Architecture overview
- Queue configuration details
- Usage examples for each queue type
- Worker implementation guide for future tasks
- Troubleshooting guide

## Success Criteria Summary

Task 1.5 is COMPLETE when:

1. ✅ BullMQ 5.x installed and compatible with ioredis 5.x
2. ✅ QueueModule created with 4 queue types configured
3. ✅ QueueService implements all CRUD operations for jobs
4. ✅ Retry strategy: 3 attempts with exponential backoff (5s initial)
5. ✅ Job timeout configured per queue type
6. ✅ Concurrency limits configured per queue type
7. ✅ Graceful shutdown implemented (OnModuleDestroy)
8. ✅ Health check endpoint (`GET /health/queues`) implemented
9. ✅ Job status polling endpoint (`GET /jobs/:jobId`) implemented
10. ✅ Redis connection reuses configuration from Task 1.4
11. ✅ Environment variables documented and validated
12. ✅ Comprehensive unit tests pass (no real Redis required)
13. ✅ All validation commands pass:
    - `npm run typecheck` → Exit 0
    - `npm run lint` → Exit 0
    - `npm test` → Exit 0, all tests pass
    - `npm run build` → Exit 0
    - Prettier check → Exit 0
14. ✅ Integration points documented for future tasks
15. ✅ No payroll/auth/notification business logic implemented
16. ✅ No modifications to requirements.md, design.md, tasks.md

## Implementation Sequence

### Phase 1: Foundation (30%)
1. Install BullMQ dependency
2. Create queue configuration interfaces
3. Create queue configuration factory
4. Create QueueConfigService with Redis connection reuse
5. Write unit tests for configuration

### Phase 2: Core Infrastructure (40%)
6. Create QueueModule
7. Implement QueueService with job operations
8. Implement health check endpoint
9. Implement job status polling endpoint
10. Write unit tests for QueueService

### Phase 3: Integration (20%)
11. Update AppModule to import QueueModule
12. Update AppController with new endpoints
13. Update environment validation
14. Update .env.example
15. Write integration tests

### Phase 4: Validation & Documentation (10%)
16. Run all validation commands
17. Fix any issues discovered
18. Update README documentation
19. Create queue module README
20. Final validation pass

---

**Plan Version**: 1.0
**Created**: 2026-08-15
**Task**: 1.5 - BullMQ Background Job Processing Infrastructure
**Status**: READY FOR IMPLEMENTATION
