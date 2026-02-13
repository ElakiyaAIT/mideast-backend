import { Injectable, OnModuleInit } from '@nestjs/common';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { ConfigService } from '../../common/config/config.service';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class MailerService implements OnModuleInit {
  private transporter!: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    const emailConfig = this.configService.getEmailConfig();

    this.transporter = nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.smtp.auth.user,
        pass: emailConfig.smtp.auth.password,
      },
    });

    await this.transporter.verify();
    this.logger.log('SMTP connection verified successfully', 'MailerService');
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<{ messageId: string }> {
    const emailConfig = this.configService.getEmailConfig();

    const result = (await this.transporter.sendMail({
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })) as SMTPTransport.SentMessageInfo;

    if (!result.messageId) {
      throw new Error('SMTP did not return a messageId');
    }

    return { messageId: result.messageId };
  }
}
