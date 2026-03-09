#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from '../seeder.module';
import { SellerUserSeeder } from '../seller-user.seedeer';

/**
 * Script to seed a default seller user
 * Usage: npm run seed:seller-user
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('SeedSellerUser');

  try {
    logger.log('Initializing application context for Seller Seeding...');
    const appContext = await NestFactory.createApplicationContext(SeederModule, {
      logger: ['error', 'warn', 'log'],
    });

    const sellerUserSeeder = appContext.get(SellerUserSeeder);
    await sellerUserSeeder.seed();

    logger.log('Seller user seeding completed successfully!');
    await appContext.close();
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Seller Seeding failed:', message);
    process.exit(1);
  }
}

void bootstrap();
