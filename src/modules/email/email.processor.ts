import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LoggerService } from '../../common/logger/logger.service';
import { MailerService } from './mailer.service';
import { EmailTemplateService } from './email-template.service';
import { EMAIL_QUEUE } from './constants/email.constants';
import { EmailJobData } from './interfaces/email-job.interface';

/**
 * Email Processor (Consumer/Worker)
 *
 * Responsibility: Process email jobs from Redis queue
 * - Runs in separate worker process (scalable)
 * - Handles template rendering
 * - Sends emails via SMTP
 * - Automatic retries on failure (configured in constants)
 * - Logs failures for debugging
 *
 * Can be scaled independently: npm run start:worker --instances=5
 */
@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  constructor(
    private readonly logger: LoggerService,
    private readonly mailerService: MailerService,
    private readonly templateService: EmailTemplateService,
  ) {
    super();
  }

  /**
   * Process email job
   * BullMQ automatically handles retries based on EMAIL_QUEUE_OPTIONS
   */
  async process(job: Job<EmailJobData>): Promise<{ messageId: string }> {
    const { to, subject, templateName, templateVariables, language } = job.data;

    this.logger.log(
      `Processing email job: jobId=${job.id}, attempt=${job.attemptsMade + 1}, to=${to}`,
      'EmailProcessor',
    );

    try {
      // 1. Render template
      const html = await this.templateService.renderTemplate(
        templateName,
        templateVariables || {},
        language || 'en',
      );

      // 2. Extract plain text from HTML
      const text = this.extractTextFromHtml(html);

      // 3. Send email
      const result = await this.mailerService.sendEmail({
        to,
        subject,
        html,
        text,
      });

      this.logger.log(
        `Email sent successfully: jobId=${job.id}, messageId=${result.messageId}, to=${to}`,
        'EmailProcessor',
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Email job failed: jobId=${job.id}, attempt=${job.attemptsMade + 1}, to=${to}, error=${errorMessage}`,
        error instanceof Error ? error.stack : String(error),
        'EmailProcessor',
      );

      // Throw error to trigger BullMQ retry mechanism
      throw error;
    }
  }

  /**
   * Handle job completion
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job<EmailJobData>): void {
    this.logger.log(`Email job completed: jobId=${job.id}, to=${job.data.to}`, 'EmailProcessor');
  }

  /**
   * Handle job failure (after all retries exhausted)
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobData> | undefined, error: Error): void {
    if (job) {
      this.logger.error(
        `Email job failed permanently: jobId=${job.id}, to=${job.data.to}, attempts=${job.attemptsMade}`,
        error.stack,
        'EmailProcessor',
      );
    }
  }

  /**
   * Extract plain text from HTML
   * Simple implementation - strips HTML tags
   */
  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
