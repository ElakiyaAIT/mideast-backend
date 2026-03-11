// common/decorators/admin-route.decorator.ts
import { SetMetadata } from '@nestjs/common';
import type { CustomDecorator } from '@nestjs/common';

export const IS_ADMIN_ROUTE_KEY = 'isAdminRoute';
export const AdminRoute = (): CustomDecorator<string> => SetMetadata(IS_ADMIN_ROUTE_KEY, true);
