import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/response.dto';
import { Request } from 'express';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data): ApiResponseDto<T> => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'message' in data &&
          'data' in data &&
          'timestamp' in data &&
          'path' in data
        ) {
          return data as ApiResponseDto<T>;
        }
        // Otherwise, wrap the response
        return new ApiResponseDto<T>(true, 'Success', data as T, undefined, request.url ?? '');
      }),
    );
  }
}
