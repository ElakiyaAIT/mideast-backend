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
 * Seller User Seeder - Seeds a default seller user for testing/initial setup
 * This seeder is idempotent and will not create duplicate users
 */
@Injectable()
export class SellerUserSeeder implements ISeeder {
  private readonly logger = new Logger(SellerUserSeeder.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly roleService: RoleService,
    private readonly configService: ConfigService,
  ) {}

  getName(): string {
    return 'SellerUserSeeder';
  }

  async seed(): Promise<void> {
    this.logger.log('Starting seller user seeding...');

    // Use config or defaults for the seller
    const sellerEmail = 'seller@example.com';
    const sellerPassword = 'Seller@123456';
    const sellerFirstName = 'Demo';
    const sellerLastName = 'Seller';

    try {
      // 1. Idempotency Check
      const existingSeller = await this.userModel.findOne({ email: sellerEmail }).exec();

      if (existingSeller) {
        this.logger.log(`Seller user "${sellerEmail}" already exists, skipping...`);
        return;
      }

      // 2. Get Seller role
      const sellerRole = await this.roleService.findByName(RoleName.SELLER);

      if (!sellerRole) {
        throw new Error('Seller role not found. Please run "npm run seed:roles" first.');
      }

      // 3. Hash password
      const hashedPassword = await PasswordHelper.hash(sellerPassword);

      // 4. Create seller user
      const sellerUser = new this.userModel({
        email: sellerEmail,
        password: hashedPassword,
        firstName: sellerFirstName,
        lastName: sellerLastName,
        roleId: sellerRole._id,
        isActive: true,
        isEmailVerified: true,
        language: 'en',
      });

      const savedUser = await sellerUser.save();

      this.logger.log('='.repeat(70));
      this.logger.log('Seller user created successfully!');
      this.logger.log(`User ID: ${savedUser._id.toString()}`);
      this.logger.log(`Email: ${sellerEmail}`);
      this.logger.log(`Role: Seller`);
      this.logger.log('='.repeat(70));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create seller user: ${message}`);
      throw error;
    }

    this.logger.log('Seller user seeding completed successfully');
  }
}
