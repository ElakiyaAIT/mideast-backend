import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { filterXSS } from 'xss';

@Injectable()
export class XssMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body as Record<string, unknown>);
    }

    // Sanitize query parameters in place (req.query is read-only)
    if (req.query && typeof req.query === 'object') {
      this.sanitizeObjectInPlace(req.query);
    }

    next();
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          sanitized[key] = filterXSS(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map((item): unknown =>
            typeof item === 'string'
              ? filterXSS(item)
              : typeof item === 'object' && item !== null
                ? this.sanitizeObject(item as Record<string, unknown>)
                : item,
          );
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize object in place (for read-only objects like req.query)
   */
  private sanitizeObjectInPlace(obj: Record<string, unknown>): void {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          obj[key] = filterXSS(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          this.sanitizeObjectInPlace(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
          // For arrays, create new sanitized array items
          obj[key] = value.map((item): unknown =>
            typeof item === 'string'
              ? filterXSS(item)
              : typeof item === 'object' && item !== null
                ? this.sanitizeObject(item as Record<string, unknown>)
                : item,
          );
        }
      }
    }
  }
}
