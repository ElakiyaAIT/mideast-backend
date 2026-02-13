import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { AppConfig } from './config.interface';

@Injectable()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    const env = process.env.NODE_ENV || 'local';
    const configPath = join(process.cwd(), 'config', `${env}.yaml`);

    console.log(`Loading configuration from: ${configPath}`);

    try {
      if (!readFileSync(configPath, 'utf8')) {
        throw new Error(`Configuration file is empty: ${configPath}`);
      }

      const fileContents = readFileSync(configPath, 'utf8');
      const parsedConfig = parse(fileContents) as AppConfig;

      if (!parsedConfig) {
        throw new Error(`Failed to parse configuration file: ${configPath}`);
      }

      // Override with environment variables if present
      const finalConfig: AppConfig = {
        ...parsedConfig,
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : parsedConfig.port,
        env: process.env.NODE_ENV || parsedConfig.env,
        database: {
          ...parsedConfig.database,
          uri: process.env.DATABASE_URI || parsedConfig.database.uri,
        },
        jwt: {
          ...parsedConfig.jwt,
          accessTokenSecret: process.env.JWT_ACCESS_SECRET || parsedConfig.jwt.accessTokenSecret,
          refreshTokenSecret: process.env.JWT_REFRESH_SECRET || parsedConfig.jwt.refreshTokenSecret,
        },
        security: {
          ...parsedConfig.security,
          csrf: {
            ...parsedConfig.security.csrf,
            secret: process.env.CSRF_SECRET || parsedConfig.security.csrf.secret,
          },
        },
      };

      // Validate critical production settings
      if (finalConfig.env === 'production') {
        this.validateProductionConfig(finalConfig);
      }

      this.config = finalConfig;
    } catch (error) {
      throw new Error(
        `Failed to load configuration file: ${configPath}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getPort(): number {
    return this.config.port;
  }

  getEnv(): string {
    return this.config.env;
  }

  getApiVersion(): string {
    return this.config.apiVersion;
  }

  getDatabaseConfig(): AppConfig['database'] {
    return this.config.database;
  }

  /**
   * Validate production configuration
   */
  private validateProductionConfig(config: AppConfig): void {
    const errors: string[] = [];

    // JWT secrets must be overridden in production
    if (
      config.jwt.accessTokenSecret === 'CHANGE_THIS_IN_PRODUCTION_ENV_VAR' ||
      config.jwt.refreshTokenSecret === 'CHANGE_THIS_IN_PRODUCTION_ENV_VAR'
    ) {
      errors.push('JWT secrets must be set via environment variables in production');
    }

    // Database URI should not be localhost in production
    if (config.database.uri.includes('localhost') || config.database.uri.includes('127.0.0.1')) {
      errors.push('Database URI should not point to localhost in production');
    }

    // Cookie secure flag must be true in production
    if (
      !config.security.cookies.accessToken.secure ||
      !config.security.cookies.refreshToken.secure
    ) {
      errors.push('Cookie secure flag must be true in production');
    }

    if (errors.length > 0) {
      throw new Error(`Production configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  getJwtConfig(): AppConfig['jwt'] {
    return this.config.jwt;
  }

  getSecurityConfig(): AppConfig['security'] {
    return this.config.security;
  }

  getEmailConfig(): AppConfig['email'] {
    return this.config.email;
  }

  getFirebaseConfig(): AppConfig['firebase'] {
    return this.config.firebase;
  }
  getAdminUserConfig(): AppConfig['adminUser'] {
    return this.config.adminUser;
  }

  getRedisConfig(): AppConfig['redis'] {
    return this.config.redis;
  }

  getStorageConfig(): AppConfig['storage'] {
    return this.config.storage;
  }

  /**
   * Get CSRF secret from configuration
   * Falls back to environment variable CSRF_SECRET
   */
  getCsrfSecret(): string {
    const secret = this.config.security.csrf.secret || process.env.CSRF_SECRET;
    if (!secret) {
      throw new Error(
        'CSRF secret is not configured. Set CSRF_SECRET in environment variables or configuration file.',
      );
    }
    return secret;
  }

  /**
   * Check if CSRF protection is enabled
   */
  isCsrfEnabled(): boolean {
    return this.config.security.csrf.enabled !== false; // Default to true
  }
}
