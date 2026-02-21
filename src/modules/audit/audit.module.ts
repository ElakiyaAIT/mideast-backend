import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  controllers: [AuditController],
  providers: [AuditService, AuditInterceptor, Reflector],
  exports: [AuditService],
})
export class AuditModule {}
