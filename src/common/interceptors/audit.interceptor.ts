import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuditService } from '@/modules/audit/audit.service';
import { AuditAction } from '@/modules/audit/enums/audit-action.enum';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly skipRoutes = [
    '/auth/login',
    '/auth/admin-login',
    '/auth/register', // optional if you don't want registration logged
    '/auth/refresh',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/google-signin',
    '/auth/profile', // GET profile
    '/auth/email-reports', // GET reports
    '/health',
    '/metrics',
    '/public',
    'csrf/token',
    '/admin/upload',
    '/admin/upload/'
  ];

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, user, body, ip, headers, params } = request;

    // Skip certain routes
    const url = request.url;
    const apiPrefix = '/api/v1';
    const pathToCheck = url.startsWith(apiPrefix) ? url.slice(apiPrefix.length) : url;

    if (this.skipRoutes.some((path) => pathToCheck.startsWith(path))) {
      console.log('Skipping route', url);
      return next.handle();
    }
    // Only log create/update/delete actions
    let action: AuditAction;
    switch (method) {
      case 'POST':
        action = AuditAction.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        action = AuditAction.UPDATE;
        break;
      case 'DELETE':
        action = AuditAction.DELETE;
        break;
      default:
        return next.handle(); // skip GET/OPTIONS/etc.
    }

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Use @AuditTarget decorator metadata if present
          const targetTypeFromDecorator = this.reflector.get<string>(
            'auditTarget',
            context.getHandler(),
          );

          // Extract targetType from URL: second-to-last segment (REST style /resource/:id)
          const segments = url.split('/').filter(Boolean); // remove empty strings
          const targetType = targetTypeFromDecorator || segments[segments.length - 2] || 'Unknown';

          // Extract targetId
          const targetId = result?._id || result?.id || body?.id || params?.id || null;

          if (!targetId) {
            console.warn('AuditInterceptor: targetId not found for', method, url);
          }

          // Log the audit action
          await this.auditService.log({
            adminId: user?.id,
            action,
            targetType: targetType.charAt(0).toUpperCase() + targetType.slice(1),
            targetId,
            description: `${action} ${targetType}`,
            changes: body,
            ipAddress: ip,
            userAgent: headers['user-agent'],
          });

          // Debug log (only for logged actions)
          console.log('AuditInterceptor triggered:', {
            method,
            url,
            userId: user?.id,
            action,
            targetType,
            targetId,
          });
        } catch (err) {
          console.error('AuditInterceptor failed to log action', err);
        }
      }),
    );
  }
}
