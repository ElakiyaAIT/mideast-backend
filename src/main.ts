import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { ConfigService } from './common/config/config.service';
import { LoggerService } from './common/logger/logger.service';
import { GlobalErrorHandler } from './common/handlers/global-error.handler';

async function bootstrap(): Promise<void> {
  try {
    console.log('Starting application bootstrap...');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'local');

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log'], // Enable console logging for startup
    });

    console.log('✓ Application module created');

    const configService = app.get(ConfigService);
    const logger = app.get(LoggerService);

    // Serve static files from uploads directory
    const storageConfig = configService.getStorageConfig();
    if (storageConfig.provider === 'disk' && storageConfig.disk) {
      const uploadsPath = join(process.cwd(), storageConfig.disk.uploadPath);
      app.useStaticAssets(uploadsPath, {
        prefix: '/uploads/',
        setHeaders: (res) => {
          res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        },
      });
      console.log('✓ Static file serving configured for uploads');
    }

    // Initialize global error handlers
    GlobalErrorHandler.initialize(logger);
    console.log('✓ Global error handlers initialized');

    console.log('✓ Config and logger services initialized');

    // Security middleware - Helmet (must be early in middleware chain)
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    );
    console.log('✓ Security headers (Helmet) configured');

    // Cookie parser middleware (must be before other middleware)
    app.use(cookieParser());
    console.log('✓ Cookie parser configured');

    // Global prefix with versioning
    const apiVersion = configService.getApiVersion();
    app.setGlobalPrefix('/api/' + apiVersion);
    console.log(`✓ API version set to: ${apiVersion}`);

    // CORS configuration
    const corsConfig = configService.getSecurityConfig().cors;
    app.enableCors({
      origin: corsConfig.origin,
      credentials: corsConfig.credentials,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposedHeaders: ['X-CSRF-Token'],
    });
    console.log('✓ CORS configured');

    // Global validation pipe is configured in app.module.ts
    // It is registered via APP_PIPE provider with i18n support
    console.log('✓ Validation pipe configured');

    // Global filters and interceptors are configured in app.module.ts
    // They are registered via APP_FILTER and APP_INTERCEPTOR providers
    console.log('✓ Global filters and interceptors configured');

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.log(`${signal} received, starting graceful shutdown...`, 'Bootstrap');
      try {
        await app.close();
        logger.log('Application closed successfully', 'Bootstrap');
        process.exit(0);
      } catch (error) {
        logger.error(
          'Error during shutdown',
          error instanceof Error ? error.stack : String(error),
          'Bootstrap',
        );
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

    const port = configService.getPort();
    await app.listen(port);

    console.log('='.repeat(60));
    console.log(`✓ Application is running on: http://localhost:${port}/api/${apiVersion}`);
    console.log(`✓ Environment: ${configService.getEnv()}`);
    console.log(`✓ Health check: http://localhost:${port}/api/${apiVersion}/health`);
    console.log('='.repeat(60));

    logger.log(
      `Application is running on: http://localhost:${port}/api/${apiVersion}`,
      'Bootstrap',
    );
    logger.log(`Environment: ${configService.getEnv()}`, 'Bootstrap');
  } catch (error) {
    console.error('='.repeat(60));
    console.error('✗ Failed to start application');
    console.error('='.repeat(60));
    console.error('Error details:');
    console.error(error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Unhandled error in bootstrap:', error);
  process.exit(1);
});
