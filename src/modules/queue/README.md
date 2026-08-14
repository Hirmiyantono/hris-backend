# Queue Module - Background Job Processing

## Overview

The Queue Module provides enterprise-ready background job processing infrastructure using BullMQ with Redis. This module implements Task 1.5 requirements and follows the approved design specifications.

## Features

- **4 Queue Types**: Payroll, Notification, Report, Maintenance
- **Exponential Backoff Retry**: Automatic retry with BullMQ native exponential backoff
- **Job Status Polling**: Query job status by ID across all queues
- **Scheduled Jobs**: Cron-based recurring job support
- **Health Monitoring**: Queue health and metrics endpoints
- **Graceful Shutdown**: Proper cleanup on application termination

## Queue Configurations

### Payroll Queue
- **Priority**: 10 (highest)
- **Concurrency**: 2 concurrent jobs
- **Timeout**: 30 minutes
- **Retry**: 3 attempts with 5000ms initial delay
- **Retry Schedule**: 10s, 20s (exponential: 2^(n-1) * 5000)
- **Use Case**: Payroll calculations, batch processing

### Notification Queue
- **Priority**: 7 (medium-high)
- **Concurrency**: 10 concurrent jobs
- **Timeout**: 1 minute
- **Retry**: 3 attempts with 2000ms initial delay
- **Retry Schedule**: 4s, 8s (exponential: 2^(n-1) * 2000)
- **Use Case**: Email/SMS delivery, push notifications

### Report Queue
- **Priority**: 3 (low)
- **Concurrency**: 3 concurrent jobs
- **Timeout**: 60 minutes
- **Retry**: 2 attempts with 10000ms initial delay
- **Retry Schedule**: 20s (exponential: 2^(n-1) * 10000)
- **Use Case**: Report generation, data exports

### Maintenance Queue
- **Priority**: 5 (medium)
- **Concurrency**: 1 concurrent job (sequential)
- **Timeout**: 10 minutes
- **Retry**: 3 attempts with 5000ms initial delay
- **Retry Schedule**: 10s, 20s (exponential: 2^(n-1) * 5000)
- **Use Case**: Scheduled maintenance, cleanup tasks

## Usage Examples

### Basic Job Addition

```typescript
import { Injectable } from '@nestjs/common';
import { QueueService } from './modules/queue/queue.service';
import { QueueType } from './modules/queue/interfaces/queue-types.enum';

@Injectable()
export class PayrollService {
  constructor(private queueService: QueueService) {}

  async executePayroll(companyId: string, periodId: string): Promise<string> {
    // Add job to payroll queue
    const job = await this.queueService.addJob(
      QueueType.PAYROLL,
      'execute-payroll',
      { companyId, periodId },
      { jobId: `payroll-${companyId}-${periodId}` } // Unique ID prevents duplicates
    );

    return job.id!; // Return job ID for status polling
  }
}
```

### Job with Custom Priority

```typescript
// Add high-priority job (lower number = higher priority)
const job = await this.queueService.addJob(
  QueueType.PAYROLL,
  'urgent-payroll',
  { companyId: '123', periodId: '2024-01' },
  { priority: 1 } // Highest priority within queue
);
```

### Scheduled/Repeatable Jobs

```typescript
// Daily leave accrual at midnight (Asia/Jakarta timezone)
const job = await this.queueService.addRepeatable(
  QueueType.MAINTENANCE,
  'accrue-leave',
  {},
  {
    pattern: '0 0 * * *', // Cron pattern: Daily at 00:00
    tz: 'Asia/Jakarta'
  }
);

// Monthly report on 1st of month at 01:00
const job = await this.queueService.addRepeatable(
  QueueType.REPORT,
  'monthly-attendance-report',
  {},
  {
    pattern: '0 1 1 * *', // Cron pattern: 1st day at 01:00
    tz: 'Asia/Jakarta'
  }
);
```

### Job Status Polling

```typescript
// Get job status
const status = await this.queueService.getJobStatus('job-id-123');

console.log(status.state); // 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
console.log(status.progress); // 0-100
console.log(status.attemptsMade); // Current attempt number
```

## API Endpoints

### Health Check
```
GET /health/queues
```

Response:
```json
{
  "status": "healthy",
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
      "workers": 0
    }
  ],
  "timestamp": "2026-08-14T23:45:00.000Z"
}
```

### Job Status
```
GET /jobs/:jobId
```

Response:
```json
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

## Worker Implementation (Future Task)

Workers process jobs from queues. This is NOT implemented in Task 1.5 but will be added in future tasks:

```typescript
import { Worker } from 'bullmq';
import { QueueType } from './interfaces/queue-types.enum';
import { getRedisConfig } from '../../config/redis.config';

// Example worker (to be implemented in future task)
const worker = new Worker(
  QueueType.PAYROLL,
  async (job) => {
    console.log(`Processing job ${job.id} with data:`, job.data);
    
    // Update progress
    await job.updateProgress(50);
    
    // Business logic goes here (implemented in future tasks)
    
    await job.updateProgress(100);
    return { success: true };
  },
  {
    connection: getRedisConfig(configService),
    concurrency: 2
  }
);

// Event listeners
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
```

## Retry Behavior

### Exponential Backoff Formula
```
delay = 2^(attemptsMade - 1) * initialDelay
```

### Examples

**Payroll Queue** (initialDelay = 5000ms, attempts = 3):
- Attempt 1: Immediate
- Retry 1 (attempt 2): Wait 2^1 * 5000 = 10,000ms (10 seconds)
- Retry 2 (attempt 3): Wait 2^2 * 5000 = 20,000ms (20 seconds)

**Notification Queue** (initialDelay = 2000ms, attempts = 3):
- Attempt 1: Immediate
- Retry 1 (attempt 2): Wait 2^1 * 2000 = 4,000ms (4 seconds)
- Retry 2 (attempt 3): Wait 2^2 * 2000 = 8,000ms (8 seconds)

## Configuration

### Environment Variables

```bash
# Queue Performance Tuning (optional)
QUEUE_PAYROLL_CONCURRENCY=2         # Default: 2
QUEUE_NOTIFICATION_CONCURRENCY=10   # Default: 10
QUEUE_REPORT_CONCURRENCY=3          # Default: 3
QUEUE_MAINTENANCE_CONCURRENCY=1     # Default: 1
```

### Redis Configuration

Queues reuse the existing Redis configuration from Task 1.4:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Integration Points

### For Payroll Service (Future Task)
```typescript
@Injectable()
export class PayrollService {
  constructor(private queueService: QueueService) {}

  async executePayroll(companyId: string, periodId: string) {
    const job = await this.queueService.addJob(
      QueueType.PAYROLL,
      'execute-payroll',
      { companyId, periodId }
    );
    return job.id;
  }
}
```

### For Notification Service (Future Task)
```typescript
@Injectable()
export class NotificationService {
  constructor(private queueService: QueueService) {}

  async sendEmail(userId: string, template: string, data: any) {
    const job = await this.queueService.addJob(
      QueueType.NOTIFICATION,
      'send-email',
      { userId, template, data }
    );
    return job.id;
  }
}
```

## Event Hooks

Queue events are already set up for future integration:

```typescript
// Success notification hook (Requirement 32.4)
queue.on('completed', (job, result) => {
  logger.log(`Job ${job.id} completed in queue "${queueType}"`, result);
  // Future integration point: notificationService.sendJobCompletedNotification(job);
});

// Failure notification hook (Requirement 32.6)
queue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`);
  // Future integration point: notificationService.sendJobFailedNotification(job, error);
});
```

## Troubleshooting

### Jobs Not Processing
- **Cause**: No workers running
- **Solution**: Workers are implemented in future tasks. Infrastructure is ready.

### Queue Health Degraded
- **Cause**: High failure rate or disconnected Redis
- **Solution**: Check Redis connection, review failed job errors

### Jobs Stuck in "waiting"
- **Cause**: No workers, or workers not configured for this job name
- **Solution**: Implement workers in future tasks

## Testing

Unit tests use mocked BullMQ and do NOT require real Redis:

```typescript
import { Test } from '@nestjs/testing';
import { QueueService } from './queue.service';

// All tests use mocks from test/jest-setup.ts
describe('QueueService', () => {
  it('should add job to queue', async () => {
    const job = await queueService.addJob(
      QueueType.PAYROLL,
      'test-job',
      { data: 'test' }
    );
    expect(job.id).toBeDefined();
  });
});
```

## References

- **BullMQ Documentation**: https://docs.bullmq.io
- **Requirement 32**: Background Job Processing
- **Task 1.5**: Set up BullMQ for background job processing
- **design.md**: Background Job Processing section
