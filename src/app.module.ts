import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { I18nService } from 'nestjs-i18n';
import { ConfigModule } from './common/config/config.module';
import { ConfigService } from './common/config/config.service';
import { LoggerModule } from './common/logger/logger.module';
import { LoggerService } from './common/logger/logger.service';
import { DatabaseModule } from './modules/database/database.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { AuctionModule } from './modules/auction/auction.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PayoutModule } from './modules/payout/payout.module';
import { CommissionModule } from './modules/commission/commission.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CmsModule } from './modules/cms/cms.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadModule } from './modules/upload/upload.module';
import { I18nModule } from './common/i18n/i18n.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { XssMiddleware } from './common/middlewares/xss.middleware';
import { PublicGuard } from './common/guards/public.guard';
import { CsrfModule } from './common/security/csrf/csrf.module';
import { CsrfGuard } from './common/security/csrf/csrf.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    I18nModule,
    CsrfModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rateLimitConfig = configService.getSecurityConfig().rateLimit;
        return {
          throttlers: [
            {
              ttl: rateLimitConfig.windowMs,
              limit: rateLimitConfig.max,
            },
          ],
        };
      },
    }),
    // BullMQ Redis Queue Configuration
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getRedisConfig().host || '127.0.0.1',
          port: configService.getRedisConfig().port || 6379,
          password: configService.getRedisConfig().password || undefined,
        },
      }),
    }),
    DatabaseModule,
    RoleModule,
    UserModule,
    AuthModule,
    EmailModule,
    EquipmentModule,
    AuctionModule,
    CommissionModule,
    OrderModule,
    PaymentModule,
    PayoutModule,
    ReportsModule,
    CmsModule,
    NotificationModule,
    AuditModule,
    SettingsModule,
    UploadModule,
    TestimonialsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useFactory: (i18nService: I18nService): HttpExceptionFilter => {
        return new HttpExceptionFilter(i18nService);
      },
      inject: [I18nService],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (logger: LoggerService): LoggingInterceptor => new LoggingInterceptor(logger),
      inject: [LoggerService],
    },
    {
      provide: APP_PIPE,
      useFactory: (i18nService: I18nService): ValidationPipe => {
        return new ValidationPipe(i18nService);
      },
      inject: [I18nService],
    },
    {
      provide: APP_GUARD,
      useClass: PublicGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(XssMiddleware).forRoutes('*');
  }
}
