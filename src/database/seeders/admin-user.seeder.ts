import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../modules/user/schemas/user.schema';
import { RoleService } from '../../modules/role/role.service';
import { RoleName } from '../../modules/role/enums/role-name.enum';
import { ISeeder } from './interfaces/seeder.interface';
import { ConfigService } from '../../common/config/config.service';
import { PasswordHelper } from '../../common/helpers/password.helper';

/**
 * Admin User Seeder - Seeds a default admin user
 * This seeder is idempotent and will not create duplicate users
 *
 * Default admin credentials:
 * - Email: admin@example.com (configurable via env)
 * - Password: Admin@123456 (configurable via env)
 * - Name: System Admin
 * Role: Admin
 * IMPORTANT: Change the default password after first login!
 */
@Injectable()
export class AdminUserSeeder implements ISeeder {
  private readonly logger = new Logger(AdminUserSeeder.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly roleService: RoleService,
    private readonly configService: ConfigService,
  ) {}

  getName(): string {
    return 'AdminUserSeeder';
  }

  async seed(): Promise<void> {
    this.logger.log('Starting admin user seeding...');

    // Get admin credentials from environment or use defaults
    const adminEmail = this.configService.getAdminUserConfig().email || 'admin@example.com';
    const adminPassword = this.configService.getAdminUserConfig().password || 'Admin@123456';
    const adminFirstName = this.configService.getAdminUserConfig().firstName || 'System';
    const adminLastName = this.configService.getAdminUserConfig().lastName || 'Admin';

    try {
      // Check if admin user already exists (idempotent check)
      const existingAdmin = await this.userModel.findOne({ email: adminEmail }).exec();

      if (existingAdmin) {
        this.logger.log(
          `Admin user "${adminEmail}" already exists with ID: ${existingAdmin._id.toString()}, skipping...`,
        );
        return;
      }

      // Get Admin role
      const adminRole = await this.roleService.findByName(RoleName.ADMIN);

      if (!adminRole) {
        throw new Error('Admin role not found. Please run "npm run seed:roles" first.');
      }

      // Hash password using PasswordHelper
      const hashedPassword = await PasswordHelper.hash(adminPassword);

      // Create admin user
      const adminUser = new this.userModel({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        roleId: adminRole._id,
        isActive: true,
        isEmailVerified: true, // Auto-verify admin email
        language: 'en',
      });

      const savedUser = await adminUser.save();

      this.logger.log('='.repeat(70));
      this.logger.log('Admin user created successfully!');
      this.logger.log('='.repeat(70));
      this.logger.log(`User ID: ${savedUser._id.toString()}`);
      this.logger.log(`Email: ${adminEmail}`);
      this.logger.log(`Password: ${adminPassword}`);
      this.logger.log(`Name: ${adminFirstName} ${adminLastName}`);
      this.logger.log(`Role: Admin`);
      this.logger.log('='.repeat(70));
      this.logger.warn('IMPORTANT: Change the admin password after first login!');
      this.logger.log('='.repeat(70));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : '';
      this.logger.error(`Failed to create admin user: ${message}`, stack);
      throw error;
    }

    this.logger.log('Admin user seeding completed successfully');
  }
}
