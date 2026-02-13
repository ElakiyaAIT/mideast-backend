import { Logger } from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';
import { DatabaseException, BusinessException } from '../exceptions';

/**
 * Utility class for handling and transforming errors
 */
export class ErrorHandlerUtil {
  private static readonly logger = new Logger(ErrorHandlerUtil.name);

  /**
   * Wraps an async operation with error handling
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context?: string,
    customErrorMessage?: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return this.handleError(error, context, customErrorMessage);
    }
  }

  /**
   * Handles and transforms errors to appropriate exceptions
   */
  static handleError(error: unknown, context?: string, customErrorMessage?: string): never {
    const errorContext = context ? `[${context}]` : '';

    // Mongoose validation errors
    if (error instanceof MongooseError.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      this.logger.warn(`${errorContext} Validation error: ${messages.join(', ')}`);
      throw new BusinessException(customErrorMessage || 'Validation failed', 'VALIDATION_ERROR');
    }

    // Mongoose cast errors
    if (error instanceof MongooseError.CastError) {
      this.logger.warn(`${errorContext} Cast error: ${error.message}`);
      throw new BusinessException(
        customErrorMessage || `Invalid ${error.path}: ${error.value}`,
        'INVALID_ID',
      );
    }

    // MongoDB duplicate key error
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === 11000
    ) {
      const errorObj = error as { keyPattern?: Record<string, unknown> };
      const field = errorObj.keyPattern ? Object.keys(errorObj.keyPattern)[0] : undefined;
      this.logger.warn(`${errorContext} Duplicate key error on field: ${field}`);
      throw new BusinessException(
        customErrorMessage ||
          `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Field'} already exists`,
        'DUPLICATE_ENTRY',
      );
    }

    // MongoDB connection errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      ((error as { name: string }).name === 'MongoServerError' ||
        (error as { name: string }).name === 'MongoNetworkError')
    ) {
      this.logger.error(`${errorContext} MongoDB error: ${(error as Error).message}`);
      throw new DatabaseException(
        customErrorMessage || 'Database connection error',
        error instanceof Error ? (error instanceof Error ? error : this.toError(error)) : undefined,
      );
    }

    // Re-throw NestJS exceptions as-is
    if (error instanceof Error && 'getStatus' in error) {
      throw error;
    }

    // Generic error handling
    if (error instanceof Error) {
      this.logger.error(`${errorContext} Unexpected error: ${error.message}`, error.stack);
      throw new DatabaseException(
        customErrorMessage || error.message || 'An unexpected error occurred',
        error,
      );
    }

    // Unknown error type
    this.logger.error(`${errorContext} Unknown error type: ${JSON.stringify(error)}`);
    throw new DatabaseException(
      customErrorMessage || 'An unknown error occurred',
      error instanceof Error ? error : this.toError(error),
    );
  }

  /**
   * Safely executes a database operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000,
    context?: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on business logic errors
        if (error instanceof BusinessException) {
          throw error;
        }

        // Don't retry on validation errors
        if (error instanceof MongooseError.ValidationError) {
          throw error;
        }

        if (attempt < maxRetries) {
          this.logger.warn(
            `${context ? `[${context}]` : ''} Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`,
          );
          await this.delay(retryDelay);
          retryDelay *= 2; // Exponential backoff
        }
      }
    }

    this.logger.error(
      `${context ? `[${context}]` : ''} Operation failed after ${maxRetries} attempts`,
      lastError?.stack,
    );
    throw new DatabaseException('Operation failed after multiple attempts', lastError || undefined);
  }

  /**
   * Safely converts an unknown error to an Error object
   */
  private static toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'object' && error !== null) {
      return new Error(JSON.stringify(error));
    }
    return new Error(String(error));
  }

  /**
   * Delay utility for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
