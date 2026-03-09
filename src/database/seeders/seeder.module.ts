import { Module } from '@nestjs/common';
import { ConfigModule } from '../../common/config/config.module';
import { DatabaseModule } from '../../modules/database/database.module';
import { RoleModule } from '../../modules/role/role.module';
import { UserModule } from '../../modules/user/user.module';
import { RoleSeeder } from './role.seeder';
import { AdminUserSeeder } from './admin-user.seeder';
import { SellerUserSeeder } from './seller-user.seedeer';

/**
 * Seeder Module
 * Imports all necessary modules and provides all seeders
 * Used by seeder scripts to seed the database
 */
@Module({
  imports: [ConfigModule, DatabaseModule, RoleModule, UserModule],
  providers: [RoleSeeder, AdminUserSeeder, SellerUserSeeder],
  exports: [RoleSeeder, AdminUserSeeder, SellerUserSeeder],
})
export class SeederModule {}
