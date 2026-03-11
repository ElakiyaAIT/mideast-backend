import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Document } from 'mongoose';
import { AuditService } from '@/modules/audit/audit.service';
import { AuditAction } from '@/modules/audit/enums/audit-action.enum';
// import { AUDIT_ENTITY_KEY } from '../decorators/audit-entity.decorator';

interface AuditRequest {
  method: string;
  user?: { id?: string };
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  ip?: string;
  headers?: Record<string, string>;
  url: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly skipRoutes = [
    '/auth/admin-refresh',
    '/auth/login',
    '/auth/admin-login',
    '/auth/admin-logout',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/google-signin',
    '/health',
    '/metrics',
    '/public',
    'csrf/token',
    '/admin/upload',
    '/admin/upload/',
  ];

  private readonly ignoredFields = [
    '_id',
    '__v',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
    'sellerId',
  ];

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuditRequest>();

    const { method, user, body = {}, ip = '', headers = {}, params = {}, url } = request;

    const apiPrefix = '/api/v1';
    const pathToCheck = url.startsWith(apiPrefix) ? url.slice(apiPrefix.length) : url;

    if (this.skipRoutes.some((path) => pathToCheck.startsWith(path))) {
      return next.handle();
    }

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
        return next.handle();
    }

    // ===== Entity Detection =====
    let entityName: string;

    // Map common route prefixes to entity names
    const routeEntityMap: Record<string, string> = {
      '/banners': 'Banner',
      '/pages': 'StaticPage',
      '/auth/profile': 'User',
    };

    // Find the first matching route in the map
    const matchedRoute = Object.keys(routeEntityMap).find((prefix) => pathToCheck.includes(prefix));
    entityName = matchedRoute
      ? routeEntityMap[matchedRoute]
      : context.getClass().name.replace('Controller', '');
    entityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

    const model = Object.values(this.connection.models).find(
      (m) => m.modelName.toLowerCase() === entityName.toLowerCase(),
    ) as Model<Document & Record<string, unknown>> | undefined;

    let oldDoc: Record<string, unknown> | null = null;
    let targetId: string | undefined;

    const fetchOldDoc = async (): Promise<void> => {
      if (action === AuditAction.UPDATE && model) {
        if ('slug' in params) {
          oldDoc = await model.findOne({ slug: params.slug }).lean().exec();
          targetId = oldDoc?._id?.toString();
        } else if (params.id) {
          targetId = params.id;
          oldDoc = await model.findById(targetId).lean().exec();
        } else if (body.id) {
          targetId = body.id as string;
          oldDoc = await model.findById(targetId).lean().exec();
        }
      }
    };

    return from(fetchOldDoc()).pipe(
      mergeMap(() =>
        next.handle().pipe(
          tap((result: unknown) => {
            let descriptionText = '';
            const changes: Record<string, { old: unknown; new: unknown }> = {};

            if (action === AuditAction.UPDATE && oldDoc) {
              for (const key of Object.keys(body)) {
                if (this.ignoredFields.includes(key)) continue;

                if (!this.deepEqualNormalized(oldDoc[key], body[key])) {
                  changes[key] = {
                    old: oldDoc[key],
                    new: body[key],
                  };
                }
              }

              // const changedKeys = Object.keys(changes);

              const changedKeys = Object.keys(changes);

              if (changedKeys.length === 0) {
                descriptionText = `Updated ${entityName}`;
              } else {
                descriptionText = changedKeys
                  .map((key) => {
                    const oldValue = changes[key].old;
                    const newValue = changes[key].new;

                    // Special case for image
                    if (key === 'image' || key === 'images' || key === 'imageUrl') {
                      if (oldValue && !newValue) return 'image removed';
                      if (!oldValue && newValue) return 'image added';
                      return 'image updated';
                    }

                    // Default behavior
                    return `${key} updated from '${this.formatValue(
                      oldValue,
                    )}' to '${this.formatValue(newValue)}'`;
                  })
                  .join(', ');
              }
            }

            if (action === AuditAction.CREATE) {
              descriptionText = `Created new ${entityName}`;
            }

            if (action === AuditAction.DELETE) {
              descriptionText = `Deleted ${entityName}`;
            }
            const record = result as { _id?: { toString(): string } | string; id?: string };

            void this.auditService.log({
              adminId: user?.id ?? '',
              action,
              targetType: entityName,
              targetId:
                targetId ||
                (typeof record?._id === 'string' ? record._id : record?._id?.toString()) ||
                record?.id ||
                '',
              description: `${action} ${entityName} - ${descriptionText}`,
              changes,
              ipAddress: ip,
              userAgent: headers['user-agent'],
            });

            // return result;
          }),
        ),
      ),
    );
  }

  private deepEqualNormalized(a: unknown, b: unknown): boolean {
    if (a == null && b == null) return true;

    let normA: unknown = a;
    let normB: unknown = b;

    if (
      normA &&
      typeof normA !== 'string' &&
      typeof (normA as { toString(): string }).toString === 'function'
    ) {
      normA = (normA as { toString(): string }).toString();
    }

    if (
      normB &&
      typeof normB !== 'string' &&
      typeof (normB as { toString(): string }).toString === 'function'
    ) {
      normB = (normB as { toString(): string }).toString();
    }

    if (normA instanceof Date) normA = normA.getTime();
    if (normB instanceof Date) normB = normB.getTime();

    if (typeof normA === 'string' && !isNaN(Date.parse(normA))) {
      normA = new Date(normA).getTime();
    }

    if (typeof normB === 'string' && !isNaN(Date.parse(normB))) {
      normB = new Date(normB).getTime();
    }

    return JSON.stringify(normA) === JSON.stringify(normB);
  }

  private formatValue(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (this.isMongoDate(value)) {
      return new Date(value.$date).toISOString();
    }

    return String(value);
  }

  private isMongoDate(value: unknown): value is { $date: string } {
    if (typeof value === 'object' && value !== null && '$date' in value) {
      const dateValue = (value as Record<string, unknown>)['$date'];
      return typeof dateValue === 'string';
    }

    return false;
  }
}
