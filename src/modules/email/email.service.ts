import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LoggerService } from '../../common/logger/logger.service';
import { EMAIL_QUEUE, EMAIL_JOBS, EMAIL_QUEUE_OPTIONS } from './constants/email.constants';
import { EmailJobData } from './interfaces/email-job.interface';

/**
 * Email Service (Producer)
 *
 * Responsibility: ONLY enqueue email jobs to Redis queue
 * - Does NOT send emails directly
 * - Does NOT block API threads
 * - Lightweight and fast
 *
 * Email processing happens in EmailProcessor (worker)
 */
@Injectable()
export class EmailService {
  constructor(
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Enqueue email job for async processing
   * Returns job ID immediately without blocking
   */
  async sendTemplatedEmail(data: EmailJobData): Promise<string> {
    try {
      const job = await this.emailQueue.add(EMAIL_JOBS.SEND_EMAIL, data, EMAIL_QUEUE_OPTIONS);

      this.logger.log(
        `Email job enqueued: jobId=${job.id}, to=${data.to}, template=${data.templateName}`,
        'EmailService',
      );

      return job.id || 'unknown';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to enqueue email job: ${errorMessage}`,
        error instanceof Error ? error.stack : String(error),
        'EmailService',
      );
      throw new Error(`Failed to enqueue email: ${errorMessage}`);
    }
  }

  /**
   * Enqueue multiple emails for async processing
   * Efficient bulk job creation
   */
  async sendBulkTemplatedEmails(emails: EmailJobData[]): Promise<string[]> {
    try {
      const jobs = await this.emailQueue.addBulk(
        emails.map((email) => ({
          name: EMAIL_JOBS.SEND_EMAIL,
          data: email,
          opts: EMAIL_QUEUE_OPTIONS,
        })),
      );

      const jobIds = jobs.map((job) => job.id || 'unknown');

      this.logger.log(`Bulk email jobs enqueued: count=${jobs.length}`, 'EmailService');

      return jobIds;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to enqueue bulk emails: ${errorMessage}`,
        error instanceof Error ? error.stack : String(error),
        'EmailService',
      );
      throw new Error(`Failed to enqueue bulk emails: ${errorMessage}`);
    }
  }
}
