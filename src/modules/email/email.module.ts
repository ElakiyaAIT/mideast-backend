import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { MailerService } from './mailer.service';
import { EmailTemplateService } from './email-template.service';
import { LoggerModule } from '../../common/logger/logger.module';
import { ConfigModule } from '../../common/config/config.module';
import { EMAIL_QUEUE } from './constants/email.constants';

/**
 * Email Module
 *
 * Production-grade email queue system with BullMQ + Redis
 *
 * Architecture:
 * - EmailService (Producer): Enqueues email jobs to Redis
 * - EmailProcessor (Consumer): Processes jobs asynchronously
 * - MailerService: Handles SMTP sending via nodemailer
 * - EmailTemplateService: Renders Handlebars templates
 *
 * Scalability:
 * - API layer: Fast, non-blocking job enqueueing
 * - Worker layer: Can scale independently (multiple instances)
 *
 * Reliability:
 * - Automatic retries with exponential backoff
 * - Failed job persistence for debugging
 * - Graceful error handling
 */
@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  providers: [EmailService, EmailProcessor, MailerService, EmailTemplateService],
  exports: [EmailService],
})
export class EmailModule {}
