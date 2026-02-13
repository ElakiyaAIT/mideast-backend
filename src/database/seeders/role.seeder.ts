import { Injectable, Logger } from '@nestjs/common';
import { RoleService } from '../../modules/role/role.service';
import { RoleName } from '../../modules/role/enums/role-name.enum';
import { RoleStatus } from '../../modules/role/enums/role-status.enum';
import { ISeeder } from './interfaces/seeder.interface';

/**
 * Role Seeder - Seeds all default roles
 * This seeder is idempotent and will not create duplicate roles
 */
@Injectable()
export class RoleSeeder implements ISeeder {
  private readonly logger = new Logger(RoleSeeder.name);

  constructor(private readonly roleService: RoleService) {}

  getName(): string {
    return 'RoleSeeder';
  }

  async seed(): Promise<void> {
    this.logger.log('Starting role seeding...');

    const roles = [
      {
        name: RoleName.ADMIN,
        description: 'Administrator with full system access and permissions',
        status: RoleStatus.ACTIVE,
      },
      {
        name: RoleName.SELLER,
        description: 'Seller with permissions to manage products and orders',
        status: RoleStatus.ACTIVE,
      },
      {
        name: RoleName.BUYER,
        description: 'Buyer with permissions to browse and purchase products',
        status: RoleStatus.ACTIVE,
      },
    ];

    for (const roleData of roles) {
      try {
        // Check if role already exists (idempotent check)
        const existingRole = await this.roleService.findByName(roleData.name);

        if (existingRole) {
          this.logger.log(`Role "${roleData.name}" already exists, skipping...`);
          continue;
        }

        // Create the role
        const createdRole = await this.roleService.create(roleData);
        this.logger.log(
          `Successfully created role "${createdRole.name}" with ID: ${createdRole._id.toString()}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : '';
        this.logger.error(`Failed to create role "${roleData.name}": ${message}`, stack);
        throw error;
      }
    }

    this.logger.log('Role seeding completed successfully');
  }
}
