import { Module } from '@nestjs/common';
import { CsrfService } from './csrf.service';
import { CsrfController } from './csrf.controller';
import { CsrfGuard } from './csrf.guard';
import { ConfigModule } from '../../config/config.module';
import { LoggerModule } from '../../logger/logger.module';

/**
 * CSRF Protection Module
 *
 * Provides centralized CSRF protection using Double Submit Cookie pattern
 *
 * Features:
 * - Automatic CSRF token generation and validation
 * - Global guard protection for all state-changing requests
 * - Token endpoint for frontend integration
 * - Secure cookie configuration (HttpOnly, Secure, SameSite)
 * - Constant-time token comparison (prevents timing attacks)
 *
 * Security Standards:
 * - OWASP CSRF Prevention Cheat Sheet compliant
 * - Double Submit Cookie pattern
 * - Cryptographically secure token generation
 * - Automatic token rotation
 *
 * Setup:
 * 1. Import CsrfModule in AppModule
 * 2. Register CsrfGuard as global guard
 * 3. Configure CSRF_SECRET in environment variables
 * 4. Frontend calls /csrf/token to obtain token
 * 5. Frontend includes token in x-csrf-token header
 *
 * @example AppModule configuration:
 * ```typescript
 * import { CsrfModule } from './common/security/csrf/csrf.module';
 * import { CsrfGuard } from './common/security/csrf/csrf.guard';
 *
 * @Module({
 *   imports: [
 *     CsrfModule,
 *     // ... other imports
 *   ],
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: CsrfGuard,
 *     },
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [ConfigModule, LoggerModule],
  controllers: [CsrfController],
  providers: [CsrfService, CsrfGuard],
  exports: [CsrfService, CsrfGuard],
})
export class CsrfModule {}
