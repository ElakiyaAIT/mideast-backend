import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Database operation exception
 */
export class DatabaseException extends HttpException {
  constructor(
    message: string = 'Database operation failed',
    public readonly originalError?: Error,
  ) {
    super(
      {
        message,
        errorCode: 'DATABASE_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
