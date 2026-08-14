import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';

/**
 * QueueModule provides background job processing infrastructure using BullMQ
 *
 * Features:
 * - 4 queue types: Payroll, Notification, Report, Maintenance
 * - Exponential backoff retry strategy (3 attempts)
 * - Job status polling and monitoring
 * - Scheduled/cron job support
 * - Graceful shutdown
 *
 * Queue configurations follow design.md specifications:
 * - Payroll: High priority, 2 concurrent, 30min timeout
 * - Notification: Medium priority, 10 concurrent, 1min timeout
 * - Report: Low priority, 3 concurrent, 60min timeout
 * - Maintenance: Medium priority, 1 concurrent, 10min timeout
 *
 * Retry schedule (BullMQ exponential backoff: 2^(attemptsMade - 1) * delay):
 * - Payroll/Maintenance (5000ms): 10s, 20s
 * - Notification (2000ms): 4s, 8s
 * - Report (10000ms): 20s
 *
 * Integration points for future tasks:
 * - Payroll service: Inject QueueService, call addJob(QueueType.PAYROLL, ...)
 * - Notification service: Inject QueueService, call addJob(QueueType.NOTIFICATION, ...)
 * - Report service: Inject QueueService, call addJob(QueueType.REPORT, ...)
 * - Worker processors: Create workers using BullMQ Worker class (future task)
 */
@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
