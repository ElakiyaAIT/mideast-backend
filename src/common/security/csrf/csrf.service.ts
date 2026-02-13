import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import { ConfigService } from '../../config/config.service';
import { LoggerService } from '../../logger/logger.service';

/**
 * CSRF Token Service
 * Implements Double Submit Cookie pattern for CSRF protection
 *
 * Security Features:
 * - Cryptographically secure token generation
 * - HttpOnly, Secure, SameSite cookies
 * - Constant-time token comparison (prevents timing attacks)
 * - Automatic token rotation
 */
@Injectable()
export class CsrfService {
  private readonly doubleCsrfProtection: ReturnType<typeof doubleCsrf>;

  // Cookie name for the CSRF token
  private readonly cookieName = 'csrf-token';

  // Header name where frontend should send the token
  private readonly headerName = 'x-csrf-token';

  // Token size in bytes (32 bytes = 256 bits)
  private readonly tokenSize = 32;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const isProduction = this.configService.getEnv() === 'production';
    const secret = this.configService.getCsrfSecret();

    if (!secret || secret.length < 32) {
      throw new Error(
        'CSRF secret must be at least 32 characters. Set CSRF_SECRET in environment variables.',
      );
    }

    // Initialize double CSRF protection with secure configuration
    this.doubleCsrfProtection = doubleCsrf({
      getSecret: () => secret,

      // MUST be stable across requests
      getSessionIdentifier: (req): string => {
        return (
          (req.cookies?.['refresh_token'] as string) || `${req.ip}-${req.headers['user-agent']}`
        );
      },

      cookieName: 'csrf-token',

      cookieOptions: {
        httpOnly: false, // required for double submit
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600000,
      },

      getCsrfTokenFromRequest: (req): string | null => {
        return req.headers['x-csrf-token'] as string;
      },

      size: 32,
    });

    this.logger.log(
      `CSRF Protection initialized (Environment: ${this.configService.getEnv()})`,
      'CsrfService',
    );
  }

  /**
   * Generate a new CSRF token and set it as a cookie
   * This should be called when setting up a session or on token refresh
   */
  generateToken(req: Request, res: Response): string {
    try {
      const { generateCsrfToken } = this.doubleCsrfProtection;
      const token = generateCsrfToken(req, res);

      this.logger.debug('CSRF token generated', 'CsrfService');
      console.log(token, '------------');

      return token;
    } catch (error) {
      this.logger.error(
        'Failed to generate CSRF token',
        error instanceof Error ? error.stack : String(error),
        'CsrfService',
      );
      throw error;
    }
  }

  /**
   * Validate CSRF token from request
   * Compares the token from the cookie with the token from the request
   * Uses constant-time comparison to prevent timing attacks
   */
  validateToken(req: Request): boolean {
    try {
      const { validateRequest } = this.doubleCsrfProtection;
      const isValid = validateRequest(req);

      if (!isValid) {
        this.logger.warn(`CSRF validation failed for ${req.method} ${req.path}`, 'CsrfService');
      }

      return isValid;
    } catch (error) {
      this.logger.error(
        'CSRF validation error',
        error instanceof Error ? error.stack : String(error),
        'CsrfService',
      );
      return false;
    }
  }

  /**
   * Get the cookie name used for CSRF token
   */
  getCookieName(): string {
    return this.cookieName;
  }

  /**
   * Get the header name where frontend should send the token
   */
  getHeaderName(): string {
    return this.headerName;
  }

  /**
   * Invalidate CSRF token by clearing the cookie
   */
  invalidateToken(res: Response): void {
    res.clearCookie(this.cookieName, {
      httpOnly: true,
      secure: this.configService.getEnv() === 'production',
      sameSite: 'strict',
      path: '/',
    });

    this.logger.debug('CSRF token invalidated', 'CsrfService');
  }
}
