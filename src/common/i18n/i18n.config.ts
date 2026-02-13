import { registerAs } from '@nestjs/config';

export interface I18nConfig {
  defaultLanguage: string;
  supportedLanguages: string[];
  fallbackLanguage: string;
}

export default registerAs(
  'i18n',
  (): I18nConfig => ({
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,es').split(','),
    fallbackLanguage: process.env.FALLBACK_LANGUAGE || 'en',
  }),
);
