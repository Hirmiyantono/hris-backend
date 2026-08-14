import { QueueType } from './queue-types.enum';

/**
 * Connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected';

/**
 * Health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Job counts for a queue
 */
export interface QueueCounts {
  /** Number of jobs waiting to be processed */
  waiting: number;

  /** Number of jobs currently being processed */
  active: number;

  /** Number of completed jobs */
  completed: number;

  /** Number of failed jobs */
  failed: number;

  /** Number of delayed jobs (waiting for retry) */
  delayed: number;
}

/**
 * Health information for a single queue
 */
export interface QueueHealth {
  /** Queue name/type */
  name: QueueType;

  /** Overall health status */
  isHealthy: boolean;

  /** Redis connection status */
  connection: ConnectionStatus;

  /** Job counts */
  counts: QueueCounts;

  /** Number of active workers */
  workers: number;
}

/**
 * Overall health response for all queues
 */
export interface QueuesHealthResponse {
  /** Overall system status */
  status: HealthStatus;

  /** Health information for each queue */
  queues: QueueHealth[];

  /** Timestamp of health check */
  timestamp: string;
}

/**
 * Queue metrics for monitoring
 */
export interface QueueMetrics {
  /** Queue name/type */
  queue: QueueType;

  /** Number of waiting jobs */
  waiting: number;

  /** Number of active jobs */
  active: number;

  /** Number of completed jobs */
  completed: number;

  /** Number of failed jobs */
  failed: number;

  /** Number of delayed jobs */
  delayed: number;

  /** Whether queue is paused */
  paused: boolean;

  /** Whether queue is paused (alias) */
  isPaused: boolean;
}
