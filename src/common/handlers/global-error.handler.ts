import { Logger } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

/**
 * Global error handlers for unhandled exceptions and rejections
 */
export class GlobalErrorHandler {
  private static readonly logger = new Logger(GlobalErrorHandler.name);

  /**
   * Initialize global error handlers
   */
  static initialize(loggerService?: LoggerService): void {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      const errorMessage = reason instanceof Error ? reason.message : String(reason);
      const errorStack = reason instanceof Error ? reason.stack : undefined;

      this.logger.error(
        `Unhandled Promise Rejection: ${errorMessage}`,
        errorStack,
        'GlobalErrorHandler',
      );

      if (loggerService) {
        loggerService.error(
          `Unhandled Promise Rejection: ${errorMessage}`,
          errorStack,
          'GlobalErrorHandler',
        );
      }

      // In production, you might want to gracefully shutdown
      // For now, we'll just log the error
      if (process.env.NODE_ENV === 'production') {
        // Optionally: send to error tracking service (Sentry, etc.)
        // Optionally: graceful shutdown
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.logger.error(`Uncaught Exception: ${error.message}`, error.stack, 'GlobalErrorHandler');

      if (loggerService) {
        loggerService.error(
          `Uncaught Exception: ${error.message}`,
          error.stack,
          'GlobalErrorHandler',
        );
      }

      // Uncaught exceptions are serious - shutdown gracefully
      this.logger.error('Application will exit due to uncaught exception');
      process.exit(1);
    });

    // Handle SIGTERM (graceful shutdown)
    process.on('SIGTERM', () => {
      this.logger.log('SIGTERM received, shutting down gracefully');
      if (loggerService) {
        loggerService.log('SIGTERM received, shutting down gracefully', 'GlobalErrorHandler');
      }
      process.exit(0);
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.logger.log('SIGINT received, shutting down gracefully');
      if (loggerService) {
        loggerService.log('SIGINT received, shutting down gracefully', 'GlobalErrorHandler');
      }
      process.exit(0);
    });

    this.logger.log('Global error handlers initialized');
  }
}
