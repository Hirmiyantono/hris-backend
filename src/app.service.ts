import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from './modules/cache/cache.service';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  getStatus(): { status: string; message: string; version: string; timestamp: string } {
    return {
      status: 'success',
      message: 'Enterprise HRIS API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth(): { status: string; uptime: number } {
    return {
      status: 'healthy',
      uptime: process.uptime(),
    };
  }

  async getDatabaseHealth(): Promise<{
    status: string;
    isConnected: boolean;
    database?: string;
    error?: string;
    responseTime: string;
    timestamp: string;
  }> {
    const startTime = Date.now();

    try {
      // Perform actual database connectivity check
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        isConnected: true,
        database: this.dataSource.options.database as string,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'error',
        isConnected: false,
        error: (error as Error).message,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getRedisHealth(): Promise<{
    status: string;
    isConnected: boolean;
    error?: string;
    responseTime: string;
    timestamp: string;
  }> {
    const startTime = Date.now();

    try {
      // Perform Redis ping check
      const pingResult = await this.cacheService.ping();
      const responseTime = Date.now() - startTime;

      if (pingResult) {
        return {
          status: 'ok',
          isConnected: true,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          status: 'error',
          isConnected: false,
          error: 'Redis ping failed',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'error',
        isConnected: false,
        error: (error as Error).message,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
