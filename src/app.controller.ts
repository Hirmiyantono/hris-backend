import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
