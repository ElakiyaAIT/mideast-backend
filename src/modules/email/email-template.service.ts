import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as handlebars from 'handlebars';
import { LoggerService } from '../../common/logger/logger.service';
import { I18nService } from 'nestjs-i18n';

/**
 * Email Template Service
 *
 * Handles email template rendering with Handlebars
 * - Caches compiled templates for performance
 * - Supports multi-language templates
 * - Injects i18n translations
 */
@Injectable()
export class EmailTemplateService {
  private readonly templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor(
    private readonly logger: LoggerService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Render email template with variables
   */
  async renderTemplate(
    templateName: string,
    variables: Record<string, string | number | boolean | undefined>,
    language: string = 'en',
  ): Promise<string> {
    const templateKey = `${templateName}_${language}`;
    let template = this.templateCache.get(templateKey);

    if (!template) {
      // Try language-specific template first
      let templatePath = join(
        process.cwd(),
        'src',
        'modules',
        'email',
        'templates',
        `${templateName}_${language}.hbs`,
      );

      // Fallback to default template
      if (!existsSync(templatePath)) {
        templatePath = join(
          process.cwd(),
          'src',
          'modules',
          'email',
          'templates',
          `${templateName}.hbs`,
        );
      }

      const templateContent = readFileSync(templatePath, 'utf-8');
      template = handlebars.compile(templateContent);
      this.templateCache.set(templateKey, template);
    }

    // Get i18n translations
    const translations = await this.getEmailTranslations(language);

    // Merge with variables
    const templateVariables = {
      ...variables,
      t: translations,
      lang: language,
    };

    return template(templateVariables);
  }

  /**
   * Get email-related translations
   */
  private async getEmailTranslations(language: string): Promise<Record<string, string>> {
    const translations: Record<string, string> = {};
    const emailKeys = [
      'email.template.forgotPassword.title',
      'email.template.forgotPassword.message',
      'email.template.forgotPassword.button',
      'email.template.forgotPassword.expiry',
    ];

    for (const key of emailKeys) {
      try {
        translations[key] = await this.i18n.translate(key, { lang: language });
      } catch {
        translations[key] = key;
      }
    }

    return translations;
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared', 'EmailTemplateService');
  }
}
