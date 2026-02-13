import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const { statusCode } = response;
          const delay = Date.now() - now;
          this.logger.log(`${method} ${url} ${statusCode} - ${delay}ms - ${ip}`, 'HTTP');
        },
        error: (error: Error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `${method} ${url} - ${delay}ms - ${error.message}`,
            error.stack,
            'HTTP',
          );
        },
      }),
    );
  }
}
