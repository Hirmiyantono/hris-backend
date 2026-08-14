import {
  HealthStatus,
  QueueHealth,
  QueuesHealthResponse,
} from '../interfaces/queue-health.interface';
import { QueueType } from '../interfaces/queue-types.enum';

/**
 * DTO for queue health response
 */
export class QueueHealthDto implements QueueHealth {
  name!: QueueType;
  isHealthy!: boolean;
  connection!: 'connected' | 'disconnected';
  counts!: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  workers!: number;

  constructor(partial: Partial<QueueHealthDto>) {
    Object.assign(this, partial);
  }
}

/**
 * DTO for overall queues health response
 */
export class QueuesHealthResponseDto implements QueuesHealthResponse {
  status!: HealthStatus;
  queues!: QueueHealth[];
  timestamp!: string;

  constructor(partial: Partial<QueuesHealthResponseDto>) {
    Object.assign(this, partial);
  }
}
