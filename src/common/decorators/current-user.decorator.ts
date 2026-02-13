// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtUser } from '../dto/response.dto';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): JwtUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: JwtUser }>();
  return request.user;
});
