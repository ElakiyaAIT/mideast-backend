import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CsrfService } from './csrf.service';
import { CsrfExempt } from './decorators/csrf-exempt.decorator';
import { Public } from '../../decorators/public.decorator';

/**
 * CSRF Token Controller
 *
 * Provides endpoints for frontend clients to obtain CSRF tokens
 *
 * Endpoints:
 * - GET /csrf/token - Get a new CSRF token
 *
 * Integration:
 * Frontend should call this endpoint on app initialization or session start
 * to obtain the CSRF token for subsequent requests
 */
@Controller('csrf')
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  /**
   * Get CSRF Token
   *
   * Generates a new CSRF token and sets it as an HttpOnly cookie
   * Returns the token value for the frontend to include in request headers
   *
   * @returns Object containing:
   *   - token: The CSRF token to include in request headers
   *   - headerName: The header name to use (x-csrf-token)
   *   - cookieName: The cookie name (for reference only, not accessible via JS)
   *
   * @example Frontend usage (fetch):
   * ```typescript
   * // 1. Get CSRF token on app initialization
   * const { token, headerName } = await fetch('/api/v1/csrf/token', {
   *   credentials: 'include'
   * }).then(res => res.json());
   *
   * // Store token in memory (not localStorage for security)
   * window.__CSRF_TOKEN__ = token;
   *
   * // 2. Include token in state-changing requests
   * await fetch('/api/v1/users', {
   *   method: 'POST',
   *   credentials: 'include',
   *   headers: {
   *     'Content-Type': 'application/json',
   *     [headerName]: token
   *   },
   *   body: JSON.stringify(data)
   * });
   * ```
   *
   * @example Frontend usage (axios):
   * ```typescript
   * // 1. Get CSRF token
   * const { token, headerName } = await axios.get('/api/v1/csrf/token', {
   *   withCredentials: true
   * }).then(res => res.data);
   *
   * // 2. Configure axios defaults
   * axios.defaults.withCredentials = true;
   * axios.defaults.headers.common[headerName] = token;
   *
   * // 3. All subsequent requests will include the token
   * await axios.post('/api/v1/users', data);
   * ```
   */
  @Get('token')
  @Public() // Allow unauthenticated access
  @CsrfExempt() // This endpoint itself must be exempt
  getToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): { token: string; message: string } {
    const token = this.csrfService.generateToken(req, res);

    return {
      token,
      message: 'CSRF token generated successfully',
    };
  }

  /**
   * Health check endpoint for CSRF service
   * Useful for monitoring and testing
   */
  @Get('health')
  @Public()
  @CsrfExempt()
  health(): { status: string; service: string; protection: string; headerName: string } {
    return {
      status: 'ok',
      service: 'CSRF Protection',
      protection: 'Double Submit Cookie',
      headerName: this.csrfService.getHeaderName(),
    };
  }
}
