import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from '../dto/response.dto';
import { Error as MongooseError } from 'mongoose';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;
    let errorCode: string | undefined;

    // Get language from request (set by i18n middleware)
    const lang = (request as { i18nLang?: string }).i18nLang || 'en';

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = await this.translateMessage(exceptionResponse, lang);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        const rawMessage =
          (typeof responseObj.message === 'string'
            ? responseObj.message
            : Array.isArray(responseObj.message)
              ? (responseObj.message as string[])[0]
              : message) || message;

        message = await this.translateMessage(rawMessage, lang);

        if (Array.isArray(responseObj.message)) {
          errors = await Promise.all(
            (responseObj.message as string[]).map((msg) => this.translateMessage(msg, lang)),
          );
          message = await this.translateMessage('errors.validationFailed', lang);
        }

        errorCode =
          (typeof responseObj.errorCode === 'string' ? responseObj.errorCode : undefined) ||
          (typeof responseObj.error === 'string' ? responseObj.error : undefined);
      }
    }
    // Handle Mongoose validation errors
    else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = await this.translateMessage('errors.validationFailed', lang);
      errors = Object.values(exception.errors).map((err) => err.message);
      errorCode = 'VALIDATION_ERROR';
    }
    // Handle Mongoose cast errors (invalid ObjectId, etc.)
    else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      const field = exception.path || 'field';
      const value = String(exception.value || 'unknown');
      message = await this.translateMessage('errors.invalidId', lang, {
        field,
        value,
      });
      errorCode = 'INVALID_ID';
    }
    // Handle duplicate key errors (MongoDB)
    else if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as { code: unknown }).code === 11000
    ) {
      status = HttpStatus.CONFLICT;
      const exceptionObj = exception as { keyPattern?: Record<string, unknown> };
      const field = exceptionObj.keyPattern ? Object.keys(exceptionObj.keyPattern)[0] : 'Field';
      message = await this.translateMessage('errors.duplicateEntry', lang, {
        field: field.charAt(0).toUpperCase() + field.slice(1),
      });
      errorCode = 'DUPLICATE_ENTRY';
    }
    // Handle generic Error instances
    else if (exception instanceof Error) {
      message = await this.translateMessage(exception.message || 'errors.generic', lang);

      // Log unexpected errors with full stack trace
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    }

    // Log error details
    const logContext = {
      status,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      userId: (request as { user?: { id: string } }).user?.id,
      errorCode,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Log server errors with full details
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      // Log client errors with context
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
        JSON.stringify(logContext),
      );
    }

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const finalMessage =
      isProduction && status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? await this.translateMessage('errors.serverError', lang)
        : message;

    const errorResponse = new ApiResponseDto<unknown>(
      false,
      finalMessage,
      undefined,
      errors,
      request.url,
    );

    // Add error code if available
    if (errorCode) {
      (errorResponse as ApiResponseDto<unknown> & { errorCode?: string }).errorCode = errorCode;
    }

    response.status(status).json(errorResponse);
  }

  private async translateMessage(
    key: string,
    lang: string,
    args?: Record<string, string>,
  ): Promise<string> {
    try {
      // Check if key exists in translations
      const translated = await this.i18n.translate(key, {
        lang,
        args: args || {},
      });
      // If translation returns the key itself, it means translation not found
      // Ensure we return a string
      const translatedString = typeof translated === 'string' ? translated : String(translated);
      return translatedString === key ? key : translatedString;
    } catch {
      // Fallback to original key if translation fails
      return key;
    }
  }
}
