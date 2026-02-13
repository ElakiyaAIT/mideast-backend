import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { API_VERSION_KEY } from '../decorators/api-version.decorator';
import { ConfigService } from '../config/config.service';

@Injectable()
export class ApiVersionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredVersion = this.reflector.getAllAndOverride<string>(API_VERSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredVersion) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const pathVersion = request.url?.split('/')[1]; // Extract version from URL like /v1/...

    return pathVersion === requiredVersion || pathVersion === this.configService.getApiVersion();
  }
}
