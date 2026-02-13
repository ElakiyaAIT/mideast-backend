import { Injectable } from '@nestjs/common';
import { ConfigService } from './common/config/config.service';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database: {
    status: 'connected' | 'disconnected';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): HealthCheckResponse {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: this.configService.getEnv(),
      version: this.configService.getApiVersion(),
      database: {
        status: 'connected', // In production, check actual DB connection
      },
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: memoryPercentage,
      },
    };
  }
}
