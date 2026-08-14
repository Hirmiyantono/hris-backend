import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { QueueService } from './modules/queue/queue.service';
import { QueuesHealthResponseDto } from './modules/queue/dto/queue-health.dto';
import { JobStatusDto } from './modules/queue/dto/job-status.dto';
import { HealthStatus, QueueHealth } from './modules/queue/interfaces/queue-health.interface';
import { QueueType } from './modules/queue/interfaces/queue-types.enum';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  getStatus(): { status: string; message: string; version: string; timestamp: string } {
    return this.appService.getStatus();
  }

  @Get('health')
  getHealth(): { status: string; uptime: number } {
    return this.appService.getHealth();
  }

  @Get('health/database')
  async getDatabaseHealth(): Promise<{
    status: string;
    isConnected: boolean;
    database?: string;
    error?: string;
    responseTime: string;
    timestamp: string;
  }> {
    return this.appService.getDatabaseHealth();
  }

  @Get('health/redis')
  async getRedisHealth(): Promise<{
    status: string;
    isConnected: boolean;
    error?: string;
    responseTime: string;
    timestamp: string;
  }> {
    return this.appService.getRedisHealth();
  }

  /**
   * Get health status for all queues (Requirement 32 - Job monitoring)
   * @returns Overall queue health status
   */
  @Get('health/queues')
  async getQueuesHealth(): Promise<QueuesHealthResponseDto> {
    const queues: QueueHealth[] = [];

    // Get health for each queue
    const queueTypes: QueueType[] = [
      QueueType.PAYROLL,
      QueueType.NOTIFICATION,
      QueueType.REPORT,
      QueueType.MAINTENANCE,
    ];
    for (const queueType of queueTypes) {
      const health = await this.queueService.getQueueHealth(queueType);
      queues.push(health);
    }

    // Determine overall status
    const allHealthy = queues.every((q) => q.isHealthy);
    const someHealthy = queues.some((q) => q.isHealthy);
    const allConnected = queues.every((q) => q.connection === 'connected');

    let status: HealthStatus;
    if (allHealthy && allConnected) {
      status = 'healthy';
    } else if (someHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return new QueuesHealthResponseDto({
      status,
      queues,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get job status by job ID (Requirement 32.3 - Job status polling)
   * @param jobId - Job identifier
   * @returns Job status information
   */
  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string): Promise<JobStatusDto> {
    const status = await this.queueService.getJobStatus(jobId);
    return new JobStatusDto(status);
  }
}
