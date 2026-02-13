import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/modules/auth/auth.service';
import { UserService } from '@/modules/user/user.service';
import { RoleService } from '@/modules/role/role.service';
import { TokenService } from '@/modules/auth/services/token.service';
import { ConfigService } from '@/common/config/config.service';
import { EmailService } from '@/modules/email/email.service';
import { EmailTemplateService } from '@/modules/email/email-template.service';
import { FirebaseService } from '@/modules/auth/services/firebase.service';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { UserDocument } from '@/modules/user/schemas/user.schema';
import { Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { getQueueToken } from '@nestjs/bullmq';
import { EMAIL_QUEUE } from '@/modules/email/constants/email.constants';

// Mock types for testing
type MockUserService = jest.Mocked<Pick<UserService, 'findByEmail' | 'setPasswordResetToken'>>;
type MockTokenService = jest.Mocked<Pick<TokenService, 'generatePasswordResetToken'>>;
type MockEmailService = jest.Mocked<
  Pick<EmailService, 'sendTemplatedEmail' | 'sendBulkTemplatedEmails'>
>;

describe('AuthService - Forgot Password', () => {
  let authService: AuthService;
  let userService: MockUserService;
  let tokenService: MockTokenService;
  let emailService: MockEmailService;

  const mockUser = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roleId: new Types.ObjectId('507f1f77bcf86cd799439012'),
    password: 'hashedPassword',
    isActive: true,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: jest.fn().mockReturnThis(),
  } as unknown as UserDocument;

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      setPasswordResetToken: jest.fn(),
    };

    const mockRoleService = {
      findByName: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        name: 'buyer',
      }),
    };

    const mockTokenService = {
      generatePasswordResetToken: jest.fn().mockReturnValue('reset-token-123'),
    };

    const mockConfigService = {
      getSecurityConfig: jest.fn().mockReturnValue({
        cors: {
          origin: ['http://localhost:3000'],
        },
      }),
    };

    const mockEmailService = {
      sendTemplatedEmail: jest.fn().mockResolvedValue('job-id-123'),
      sendBulkTemplatedEmails: jest.fn().mockResolvedValue(['job-id-1', 'job-id-2']),
    };

    const mockEmailTemplateService = {
      renderTemplate: jest.fn().mockReturnValue('<html>Email Template</html>'),
    };

    const mockFirebaseService = {
      verifyIdToken: jest.fn(),
    };

    const mockI18nService = {
      t: jest.fn((key: string) => key),
      translate: jest.fn((key: string) => Promise.resolve(key)),
    };

    const mockEmailQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: EmailTemplateService,
          useValue: mockEmailTemplateService,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
        {
          provide: getQueueToken(EMAIL_QUEUE),
          useValue: mockEmailQueue,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<MockUserService>(UserService);
    tokenService = module.get<MockTokenService>(TokenService);
    emailService = module.get<MockEmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should successfully send password reset email when user exists', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.setPasswordResetToken.mockResolvedValue(undefined);
      emailService.sendTemplatedEmail.mockResolvedValue('job-id-123');

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result.message).toBe(
        'If an account with that email exists, a password reset link has been sent.',
      );
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(tokenService.generatePasswordResetToken).toHaveBeenCalled();
      expect(userService.setPasswordResetToken).toHaveBeenCalledWith(
        'test@example.com',
        'reset-token-123',
        expect.any(Date),
      );
      const emailCall = emailService.sendTemplatedEmail.mock.calls[0][0];
      expect(emailCall).toMatchObject({
        to: 'test@example.com',
        templateName: 'forgot-password',
      });
      expect(typeof emailCall.subject).toBe('string');
      expect(emailCall.templateVariables).toMatchObject({
        userName: 'Test User',
        resetUrl: 'http://localhost:3000/reset-password?token=reset-token-123',
        expiryTime: '1 hour',
      });
    });

    it('should return success message even when user does not exist (security)', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result.message).toBe(
        'If an account with that email exists, a password reset link has been sent.',
      );
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(tokenService.generatePasswordResetToken).not.toHaveBeenCalled();
      expect(userService.setPasswordResetToken).not.toHaveBeenCalled();
      expect(emailService.sendTemplatedEmail).not.toHaveBeenCalled();
    });

    it('should use email prefix as userName when name is not available', async () => {
      // Arrange
      const userWithoutName = {
        ...mockUser,
        firstName: undefined as unknown as string,
      } as UserDocument;
      userService.findByEmail.mockResolvedValue(userWithoutName);
      userService.setPasswordResetToken.mockResolvedValue(undefined);
      emailService.sendTemplatedEmail.mockResolvedValue('job-id-123');

      // Act
      await authService.forgotPassword(forgotPasswordDto);

      // Assert
      const emailCall = emailService.sendTemplatedEmail.mock.calls[0][0];
      expect(emailCall).toMatchObject({
        templateName: 'forgot-password',
      });
      expect(emailCall.templateVariables).toMatchObject({
        userName: 'test',
        resetUrl: 'http://localhost:3000/reset-password?token=reset-token-123',
        expiryTime: '1 hour',
      });
    });

    it('should handle email queue errors gracefully', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.setPasswordResetToken.mockResolvedValue(undefined);
      emailService.sendTemplatedEmail.mockRejectedValue(new Error('Queue error'));

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result.message).toBe(
        'If an account with that email exists, a password reset link has been sent.',
      );
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const forgotPasswordDtoUpperCase: ForgotPasswordDto = {
        email: 'TEST@EXAMPLE.COM',
      };
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.setPasswordResetToken.mockResolvedValue(undefined);
      emailService.sendTemplatedEmail.mockResolvedValue('job-id-123');

      // Act
      await authService.forgotPassword(forgotPasswordDtoUpperCase);

      // Assert
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userService.setPasswordResetToken).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        expect.any(Date),
      );
      expect(emailService.sendTemplatedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
        }),
      );
    });

    it('should set token expiry to 1 hour from now', async () => {
      // Arrange
      const now = new Date();
      jest.useFakeTimers();
      jest.setSystemTime(now);

      userService.findByEmail.mockResolvedValue(mockUser);
      userService.setPasswordResetToken.mockResolvedValue(undefined);
      emailService.sendTemplatedEmail.mockResolvedValue('job-id-123');

      // Act
      await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(userService.setPasswordResetToken).toHaveBeenCalledWith(
        'test@example.com',
        'reset-token-123',
        expect.any(Date),
      );

      const expiryDate = userService.setPasswordResetToken.mock.calls[0][2];
      const expectedExpiry = new Date(now);
      expectedExpiry.setHours(expectedExpiry.getHours() + 1);

      // Allow 1 second difference for execution time
      const timeDiff = Math.abs(expiryDate.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(1000);

      jest.useRealTimers();
    });

    it('should include reset token in the reset URL', async () => {
      // Arrange
      const customToken = 'custom-reset-token-456';
      tokenService.generatePasswordResetToken.mockReturnValue(customToken);
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.setPasswordResetToken.mockResolvedValue(undefined);
      emailService.sendTemplatedEmail.mockResolvedValue('job-id-123');

      // Act
      await authService.forgotPassword(forgotPasswordDto);

      // Assert
      const emailCall = emailService.sendTemplatedEmail.mock.calls[0][0];
      expect(emailCall).toMatchObject({
        templateName: 'forgot-password',
      });
      expect(emailCall.templateVariables).toMatchObject({
        resetUrl: `http://localhost:3000/reset-password?token=${customToken}`,
      });
    });
  });
});
