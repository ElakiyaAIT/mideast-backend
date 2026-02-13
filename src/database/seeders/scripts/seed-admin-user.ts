#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from '../seeder.module';
import { AdminUserSeeder } from '../admin-user.seeder';

/**
 * Script to seed the admin user
 * Usage: npm run seed:admin-user or pnpm seed:admin-user
 *
 * Prerequisites:
 * 1. Run role seeders first: npm run seed:roles
 *
 * Environment Variables (optional):
 * - ADMIN_EMAIL: Admin user email (default: admin@example.com)
 * - ADMIN_PASSWORD: Admin user password (default: Admin@123456)
 * - ADMIN_FIRST_NAME: Admin first name (default: System)
 * - ADMIN_LAST_NAME: Admin last name (default: Admin)
 *
 * Example with custom credentials:
 * ADMIN_EMAIL=admin@mysite.com ADMIN_PASSWORD=MySecurePass123! npm run seed:admin-user
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('SeedAdminUser');

  try {
    logger.log('Initializing application context...');
    const appContext = await NestFactory.createApplicationContext(SeederModule, {
      logger: ['error', 'warn', 'log'],
    });

    logger.log('Running Admin User Seeder...');
    const adminUserSeeder = appContext.get(AdminUserSeeder);
    await adminUserSeeder.seed();

    logger.log('Admin user seeding completed successfully!');
    await appContext.close();
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    logger.error('Seeding failed:', message, stack);
    process.exit(1);
  }
}

void bootstrap();
