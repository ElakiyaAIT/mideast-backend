import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Business logic exception for domain-specific errors
 */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode?: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        errorCode: errorCode || 'BUSINESS_ERROR',
        statusCode,
      },
      statusCode,
    );
  }
}
