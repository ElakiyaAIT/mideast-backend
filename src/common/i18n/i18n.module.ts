import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  I18nModule as NestI18nModule,
  I18nJsonLoader,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import * as fs from 'fs';
import i18nConfig from './i18n.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(i18nConfig),
    NestI18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        // Determine the correct path based on whether we're running from src or dist
        // In watch mode (dev), code runs from src, otherwise from dist
        // nest-cli.json is configured to copy i18n folder to dist during build
        path: ((): string => {
          const distPath = path.join(process.cwd(), 'dist', 'i18n');
          const srcPath = path.join(process.cwd(), 'src', 'i18n');

          // Check if dist/i18n exists (compiled build), use it
          if (fs.existsSync(distPath)) {
            return distPath;
          }

          // Otherwise use src/i18n (development/watch mode)
          return srcPath;
        })(),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        new HeaderResolver(['x-custom-lang', 'accept-language']),
        AcceptLanguageResolver,
      ],
    }),
  ],
  exports: [NestI18nModule],
})
export class I18nModule {}
