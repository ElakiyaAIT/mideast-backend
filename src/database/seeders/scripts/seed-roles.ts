#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from '../seeder.module';
import { RoleSeeder } from '../role.seeder';

/**
 * Script to seed all roles (Admin, Seller, Buyer)
 * Usage: npm run seed:roles or pnpm seed:roles
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('SeedRoles');

  try {
    logger.log('Initializing application context...');
    const appContext = await NestFactory.createApplicationContext(SeederModule, {
      logger: ['error', 'warn', 'log'],
    });

    logger.log('Running Role Seeder...');
    const roleSeeder = appContext.get(RoleSeeder);
    await roleSeeder.seed();

    logger.log('All seeders completed successfully!');
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
