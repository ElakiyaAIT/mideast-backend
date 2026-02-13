import { Types } from 'mongoose';
import { UserDocument } from '@/modules/user/schemas/user.schema';
import { RoleDocument } from '@/modules/role/schemas/role.schema';

/**
 * Factory for creating mock MongoDB ObjectIds
 */
export class MockObjectIdFactory {
  static create(id?: string): Types.ObjectId {
    return new Types.ObjectId(id || undefined);
  }

  static createFromString(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }
}

/**
 * Factory for creating mock User documents
 */
export class MockUserFactory {
  static create(overrides?: Partial<UserDocument>): Partial<UserDocument> {
    return {
      _id: MockObjectIdFactory.create(),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleId: MockObjectIdFactory.create(),
      password: 'hashedPassword123',
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: jest.fn().mockReturnThis(),
      ...overrides,
    } as Partial<UserDocument>;
  }

  static createMany(count: number): Partial<UserDocument>[] {
    return Array.from({ length: count }, (_, i) =>
      MockUserFactory.create({
        email: `user${i}@example.com`,
        firstName: `User${i}`,
      }),
    );
  }
}

/**
 * Factory for creating mock Role documents
 */
export class MockRoleFactory {
  static create(overrides?: Partial<RoleDocument>): Partial<RoleDocument> {
    return {
      _id: MockObjectIdFactory.create(),
      name: 'user',
      displayName: 'User',
      description: 'Regular user role',
      permissions: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: jest.fn().mockReturnThis(),
      ...overrides,
    } as Partial<RoleDocument>;
  }
}

/**
 * Mock ConfigService factory
 */
export class MockConfigServiceFactory {
  static create(): {
    get: jest.Mock<string, [string]>;
    getSecurityConfig: jest.Mock<{ cors: { origin: string[] } }>;
    getDatabaseConfig: jest.Mock<{ uri: string }>;
  } {
    return {
      get: jest.fn((key: string): string => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRATION: '1h',
          REFRESH_TOKEN_EXPIRATION: '7d',
        };
        return config[key];
      }),
      getSecurityConfig: jest.fn<{ cors: { origin: string[] } }, []>().mockReturnValue({
        cors: {
          origin: ['http://localhost:3000'],
        },
      }),
      getDatabaseConfig: jest.fn<{ uri: string }, []>().mockReturnValue({
        uri: 'mongodb://localhost:27017/test',
      }),
    };
  }
}

/**
 * Mock EmailService factory
 */
export class MockEmailServiceFactory {
  static create(): {
    sendEmail: jest.Mock<Promise<string>, [unknown]>;
    sendTemplatedEmail: jest.Mock<Promise<string>, [unknown]>;
    sendBulkTemplatedEmails: jest.Mock<Promise<string[]>, [unknown]>;
  } {
    return {
      sendEmail: jest.fn<Promise<string>, [unknown]>().mockResolvedValue('job-id-123'),
      sendTemplatedEmail: jest.fn<Promise<string>, [unknown]>().mockResolvedValue('job-id-123'),
      sendBulkTemplatedEmails: jest
        .fn<Promise<string[]>, [unknown]>()
        .mockResolvedValue(['job-id-1', 'job-id-2']),
    };
  }
}

/**
 * Mock Logger factory
 */
export class MockLoggerFactory {
  static create(): {
    log: jest.Mock<void, [unknown]>;
    error: jest.Mock<void, [unknown]>;
    warn: jest.Mock<void, [unknown]>;
    debug: jest.Mock<void, [unknown]>;
    verbose: jest.Mock<void, [unknown]>;
  } {
    return {
      log: jest.fn<void, [unknown]>(),
      error: jest.fn<void, [unknown]>(),
      warn: jest.fn<void, [unknown]>(),
      debug: jest.fn<void, [unknown]>(),
      verbose: jest.fn<void, [unknown]>(),
    };
  }
}

/**
 * Mock I18n Service factory
 */
export class MockI18nServiceFactory {
  static create(): {
    t: jest.Mock<string, [string]>;
    translate: jest.Mock<string, [string]>;
  } {
    return {
      t: jest.fn((key: string) => key),
      translate: jest.fn((key: string) => key),
    };
  }
}

/**
 * Mock Mongoose Model factory
 */
export class MockMongooseModelFactory {
  static create(): {
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    exec: jest.Mock;
    populate: jest.Mock;
    select: jest.Mock;
    limit: jest.Mock;
    skip: jest.Mock;
    sort: jest.Mock;
    countDocuments: jest.Mock;
    deleteOne: jest.Mock;
    updateOne: jest.Mock;
  } {
    return {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      create: jest.fn(),
      save: jest.fn(),
      exec: jest.fn(),
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockReturnThis(),
      deleteOne: jest.fn().mockReturnThis(),
      updateOne: jest.fn().mockReturnThis(),
    };
  }
}
