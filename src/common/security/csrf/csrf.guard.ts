import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CsrfService } from './csrf.service';
import { LoggerService } from '../../logger/logger.service';

/**
 * Metadata key for marking routes as CSRF-exempt
 */
export const CSRF_EXEMPT_KEY = 'csrf_exempt';

/**
 * CSRF Protection Guard
 *
 * Enforces CSRF protection on all state-changing HTTP methods:
 * - POST, PUT, PATCH, DELETE
 *
 * Automatically excludes:
 * - GET, HEAD, OPTIONS (idempotent/safe methods)
 * - Routes marked with @CsrfExempt() decorator
 *
 * Usage:
 * - Applied globally via APP_GUARD provider
 * - Individual routes can opt-out using @CsrfExempt() decorator
 *
 * Security:
 * - Returns 403 Forbidden on validation failure
 * - Logs all validation failures for security monitoring
 * - Does not leak information about why validation failed
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  // HTTP methods that require CSRF protection
  private readonly protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  constructor(
    private readonly csrfService: CsrfService,
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Skip CSRF validation for safe/idempotent methods
    if (!this.protectedMethods.includes(method)) {
      return true;
    }

    // Check if route is marked as CSRF-exempt
    const isCsrfExempt =
      this.reflector.getAllAndOverride<boolean>(CSRF_EXEMPT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isCsrfExempt) {
      this.logger.debug(
        `CSRF check skipped for exempt route: ${method} ${request.path}`,
        'CsrfGuard',
      );
      return true;
    }
    // Validate CSRF token
    const isValid = this.csrfService.validateToken(request);

    if (!isValid) {
      this.logger.warn(
        `CSRF validation failed: ${method} ${request.path} | IP: ${this.getClientIp(request)}`,
        'CsrfGuard',
      );

      throw new ForbiddenException({
        statusCode: 403,
        message: 'CSRF token validation failed',
        error: 'Forbidden',
      });
    }

    this.logger.debug(`CSRF validation passed: ${method} ${request.path}`, 'CsrfGuard');

    return true;
  }

  /**
   * Extract client IP address from request
   * Handles proxies and load balancers
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
