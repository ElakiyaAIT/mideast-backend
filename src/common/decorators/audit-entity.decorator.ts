import { SetMetadata } from '@nestjs/common';

export const AUDIT_ENTITY_KEY = 'audit_entity';

export const AuditEntity = (entity: string): MethodDecorator =>
  SetMetadata(AUDIT_ENTITY_KEY, entity);
