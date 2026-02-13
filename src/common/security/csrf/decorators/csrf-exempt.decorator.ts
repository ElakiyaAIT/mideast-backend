import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { CSRF_EXEMPT_KEY } from '../csrf.guard';

/**
 * Decorator to mark a route or controller as exempt from CSRF protection
 *
 * Use cases:
 * - Public API endpoints (e.g., webhooks from third-party services)
 * - Initial authentication endpoints (before CSRF token is established)
 * - Health check endpoints
 *
 * WARNING: Use sparingly and only when absolutely necessary
 * Overuse of this decorator can create security vulnerabilities
 *
 * @example
 * // Exempt a single route
 * @Post('webhook')
 * @CsrfExempt()
 * handleWebhook() {
 *   // ...
 * }
 *
 * @example
 * // Exempt entire controller (not recommended)
 * @Controller('public')
 * @CsrfExempt()
 * export class PublicController {
 *   // ...
 * }
 */
export const CsrfExempt = (): CustomDecorator<string> => SetMetadata(CSRF_EXEMPT_KEY, true);
