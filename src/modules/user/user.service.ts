import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { PasswordHelper } from '../../common/helpers/password.helper';
import { StringHelper } from '../../common/helpers/string.helper';
import { ErrorHandlerUtil } from '../../common/utils/error-handler.util';
import { RoleName, RoleService } from '../role';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly roleService: RoleService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const normalizedEmail = StringHelper.toLowerCase(createUserDto.email);
      const existingUser = await this.userModel.findOne({
        email: normalizedEmail,
        isDeleted: false,
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Validate: Either password or firebaseUid must be provided
      // if (!createUserDto.password && !createUserDto.firebaseUid) {
      //   throw new BadRequestException('Either password or firebaseUid must be provided');
      // }

      // Hash password only if provided (not required for Firebase users)
      const hashedPassword = createUserDto.password
        ? await PasswordHelper.hash(createUserDto.password)
        : undefined;

      const userData: Partial<CreateUserDto> = {
        ...createUserDto,
        email: normalizedEmail,
      };

      if (hashedPassword) {
        userData.password = hashedPassword;
      }

      if (createUserDto.firebaseUid) {
        userData.firebaseUid = createUserDto.firebaseUid;
      }

      const user = new this.userModel(userData);
      console.log(user, '-----------user before save');
      const savedUser = await user.save();
      return this.toResponseDto(savedUser);
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'UserService.create', 'Failed to create user');
    }
  }

  async findAll(queryDto: UserListQueryDto): Promise<PaginationResultDto<UserResponseDto>> {
    try {
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const skip = (page - 1) * limit;

      // Build search filter
      const filter: Record<string, unknown> = {};
      // Exclude soft-deleted users by default
      filter.isDeleted = false;
      const adminRole = await this.roleService.findByName(RoleName.ADMIN);
      filter.roleId = { $ne: adminRole ? adminRole._id : null };
      if (queryDto.search) {
        const searchRegex = new RegExp(queryDto.search, 'i');
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ];
      }

      // Build sort options
      const sortOptions: Record<string, 1 | -1> = {};
      if (queryDto.sortBy) {
        sortOptions[queryDto.sortBy] = queryDto.sortOrder === 'desc' ? -1 : 1;
      } else {
        // Default sort by createdAt descending
        sortOptions.createdAt = -1;
      }

      // Execute queries in parallel
      const [users, total] = await Promise.all([
        this.userModel
          .find(filter)
          .populate('roleId', 'name')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.userModel.countDocuments(filter).exec(),
      ]);

      return new PaginationResultDto(
        users.map((user) => this.toResponseDto(user)),
        total,
        page,
        limit,
      );
    } catch (error) {
      ErrorHandlerUtil.handleError(error, 'UserService.findAll', 'Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, isDeleted: false })
        .populate('roleId')
        .exec();
      console.log(user, '-----------user');
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.toResponseDto(user);
    } catch (error) {
      ErrorHandlerUtil.handleError(error, 'UserService.findOne', 'Failed to fetch user');
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      const normalizedEmail = StringHelper.toLowerCase(email);
      return await this.userModel
        .findOne({ email: normalizedEmail, isDeleted: false })
        .populate('roleId')
        .select('+password +firebaseUid +refreshToken')
        .exec();
    } catch (error) {
      return ErrorHandlerUtil.handleError(
        error,
        'UserService.findByEmail',
        'Failed to find user by email',
      );
    }
  }

  async findByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
    try {
      return await this.userModel
        .findOne({ firebaseUid, isDeleted: false })
        .select('+password +firebaseUid')
        .exec();
    } catch (error) {
      return ErrorHandlerUtil.handleError(
        error,
        'UserService.findByFirebaseUid',
        'Failed to find user by Firebase UID',
      );
    }
  }

  /**
   * Find user by ID with populated roleId
   * Use this method when you need the full role information
   */
  async findOneWithRole(id: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ _id: id, isDeleted: false }).populate('roleId').exec();
    } catch (error) {
      return ErrorHandlerUtil.handleError(
        error,
        'UserService.findOneWithRole',
        'Failed to fetch user with role',
      );
    }
  }

  /**
   * Find user by email with populated roleId
   * Use this method when you need the full role information during authentication
   */
  async findByEmailWithRole(email: string): Promise<UserDocument | null> {
    try {
      const normalizedEmail = StringHelper.toLowerCase(email);
      return await this.userModel
        .findOne({ email: normalizedEmail, isDeleted: false })
        .populate('roleId')
        .select('+password +firebaseUid')
        .exec();
    } catch (error) {
      return ErrorHandlerUtil.handleError(
        error,
        'UserService.findByEmailWithRole',
        'Failed to find user with role by email',
      );
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.userModel.findOne({ _id: id, isDeleted: false }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (updateUserDto.email) {
        updateUserDto.email = StringHelper.toLowerCase(updateUserDto.email);
        const existingUser = await this.userModel
          .findOne({ email: updateUserDto.email, _id: { $ne: id }, isDeleted: false })
          .exec();
        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }
      }

      Object.assign(user, updateUserDto);
      const updatedUser = await user.save();
      this.logger.log(`User updated: ${id}`);
      return this.toResponseDto(updatedUser);
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'UserService.update', 'Failed to update user');
    }
  }

  async remove(id: string, deletedBy?: string): Promise<void> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if already deleted
      if (user.isDeleted) {
        throw new BadRequestException('User is already deleted');
      }

      // Soft delete: update flags instead of removing
      await this.userModel
        .findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
          ...(deletedBy && { deletedBy }),
        })
        .exec();
      this.logger.log(`User soft deleted: ${id}`);
    } catch (error) {
      ErrorHandlerUtil.handleError(error, 'UserService.remove', 'Failed to delete user');
    }
  }

  async restore(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isDeleted) {
        throw new BadRequestException('User is not deleted');
      }

      const restoredUser = await this.userModel
        .findByIdAndUpdate(
          id,
          {
            isDeleted: false,
            $unset: { deletedAt: 1, deletedBy: 1 },
          },
          { new: true },
        )
        .exec();

      if (!restoredUser) {
        throw new NotFoundException('Failed to restore user');
      }

      this.logger.log(`User restored: ${id}`);
      return this.toResponseDto(restoredUser);
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'UserService.restore', 'Failed to restore user');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    try {
      await this.userModel.findByIdAndUpdate(userId, { refreshToken }).exec();
    } catch (error) {
      ErrorHandlerUtil.handleError(
        error,
        'UserService.updateRefreshToken',
        'Failed to update refresh token',
      );
    }
  }

  async setPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    try {
      const normalizedEmail = StringHelper.toLowerCase(email);
      await this.userModel
        .findOneAndUpdate(
          { email: normalizedEmail },
          {
            passwordResetToken: token,
            passwordResetExpires: expiresAt,
          },
        )
        .exec();
    } catch (error) {
      ErrorHandlerUtil.handleError(
        error,
        'UserService.setPasswordResetToken',
        'Failed to set password reset token',
      );
    }
  }

  async findByPasswordResetToken(token: string): Promise<UserDocument | null> {
    try {
      return await this.userModel
        .findOne({
          passwordResetToken: token,
          passwordResetExpires: { $gt: new Date() },
        })
        .select('+password +passwordResetToken')
        .exec();
    } catch (error) {
      return ErrorHandlerUtil.handleError(
        error,
        'UserService.findByPasswordResetToken',
        'Failed to find user by reset token',
      );
    }
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    try {
      await this.userModel
        .findByIdAndUpdate(userId, {
          $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
        })
        .exec();
    } catch (error) {
      ErrorHandlerUtil.handleError(
        error,
        'UserService.clearPasswordResetToken',
        'Failed to clear password reset token',
      );
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await PasswordHelper.hash(newPassword);
      await this.userModel
        .findByIdAndUpdate(userId, {
          password: hashedPassword,
          $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
        })
        .exec();
    } catch (error) {
      ErrorHandlerUtil.handleError(
        error,
        'UserService.updatePassword',
        'Failed to update password',
      );
    }
  }

  private toResponseDto(user: UserDocument): UserResponseDto {
    const response: UserResponseDto = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId as unknown as { _id: string; name: string },
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt as Date,
      updatedAt: user.updatedAt as Date,
    };

    // If roleId is populated, include the role name
    if (user.roleId && typeof user.roleId === 'object' && 'name' in user.roleId) {
      response.roleName = (user.roleId as { name: RoleName }).name;
    }
    return response;
  }

  async verify(id: string): Promise<UserResponseDto> {
    try {
      const userDoc = await this.userModel.findById(id);

      if (!userDoc) {
        throw new NotFoundException('User not found');
      }
      // Implement verification logic - could add isVerified field to schema
      // For now, we'll use isEmailVerified
      userDoc.isEmailVerified = true;
      await userDoc.save();
      return this.toResponseDto(userDoc);
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'UserService.verify', 'Failed to verify user');
    }
  }

  async suspend(id: string, reason: string): Promise<UserResponseDto> {
    try {
      const userDoc = await this.userModel.findById(id);
      if (!userDoc) {
        throw new NotFoundException('User not found');
      }
      userDoc.isActive = false;
      userDoc.reasonForDeactivation = reason;
      // Could add suspendedUntil field to schema
      await userDoc.save();
      return this.toResponseDto(userDoc);
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'UserService.suspend', 'Failed to suspend user');
    }
  }

  async block(id: string, reason: string): Promise<UserResponseDto> {
    try {
      const userDoc = await this.userModel.findById(id);
      if (!userDoc) {
        throw new NotFoundException('User not found');
      }
      userDoc.isActive = false;
      userDoc.reasonForDeactivation = reason;
      // Could add isBlocked field to schema
      await userDoc.save();
      return this.toResponseDto(userDoc);
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'UserService.block', 'Failed to block user');
    }
  }
}
