import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '../../common/config/config.service';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { RoleName } from '../role/enums/role-name.enum';
import { EmailService } from '../email/email.service';
import { TokenService } from './services/token.service';
import { FirebaseService } from './services/firebase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { AuthResponseDto, QueueStatsDto } from './dto/auth-response.dto';
import { PasswordHelper } from '../../common/helpers/password.helper';
import { StringHelper } from '../../common/helpers/string.helper';
import { JwtPayload } from './strategies/jwt.strategy';
import { ErrorHandlerUtil } from '../../common/utils/error-handler.util';
import { I18nService } from 'nestjs-i18n';
import { RoleDocument } from '../role';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE } from '../email/constants/email.constants';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private defaultRoleId: string;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private tokenService: TokenService,
    private configService: ConfigService,
    private emailService: EmailService,
    private firebaseService: FirebaseService,
    private i18n: I18nService,
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue,
  ) {}

  /**
   * Cache default role ID on module initialization
   * This avoids repeated database queries for the buyer role
   */
  async onModuleInit(): Promise<void> {
    try {
      // Get Buyer role as default for new registrations
      const buyerRole = await this.roleService.findByName(RoleName.BUYER);
      if (buyerRole) {
        this.defaultRoleId = buyerRole._id.toString();
        this.logger.log(`Default role ID cached: ${this.defaultRoleId}`);
      } else {
        this.logger.warn('Buyer role not found. Run seeders: npm run seed:roles');
      }
    } catch (error) {
      this.logger.error('Failed to cache default role ID:', error);
    }
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto, res: Response): Promise<AuthResponseDto> {
    try {
      const normalizedEmail = StringHelper.toLowerCase(registerDto.email);

      if (!this.defaultRoleId) {
        throw new Error('Default role not configured');
      }

      const user = await this.userService.create({
        ...registerDto,
        email: normalizedEmail,
        roleId: this.defaultRoleId,
      });

      return await this.generateTokensAndSetCookies(
        user.id,
        user.email,
        user.roleName,
        user.roleId,
        res,
      );
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'AuthService.register', 'Failed to register user');
    }
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto, res: Response): Promise<AuthResponseDto> {
    try {
      const normalizedEmail = StringHelper.toLowerCase(loginDto.email);
      const user = await this.userService.findByEmail(normalizedEmail);

      if (!user) {
        throw new UnauthorizedException('Invalid Email address');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      // Check if user has a password (not a Firebase-only user)
      if (!user.password) {
        throw new UnauthorizedException(
          'This account uses Google Sign In. Please sign in with Google.',
        );
      }

      const isPasswordValid = await PasswordHelper.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      const role = user.roleId as unknown as RoleDocument;

      if (role.name === RoleName.ADMIN) {
        throw new UnauthorizedException('Do not use this endpoint for admin login');
      }

      return await this.generateTokensAndSetCookies(
        user._id.toString(),
        user.email,
        role.name,
        user.roleId as unknown as { _id: string; name: string },
        res,
      );
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'AuthService.login', 'Failed to login user');
    }
  }

  async adminLogin(loginDto: LoginDto, res: Response): Promise<AuthResponseDto> {
    try {
      const normalizedEmail = StringHelper.toLowerCase(loginDto.email);
      const user = await this.userService.findByEmail(normalizedEmail);
      console.log('Admin login attempt for user:', normalizedEmail, user);
      if (!user) {
        throw new UnauthorizedException('Invalid Email address');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      // Check if user has a password (not a Firebase-only user)
      if (!user.password) {
        throw new UnauthorizedException(
          'This account uses Google Sign In. Please sign in with Google.',
        );
      }

      const isPasswordValid = await PasswordHelper.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      const role = user.roleId as unknown as RoleDocument;

      if (role.name !== RoleName.ADMIN) {
        throw new UnauthorizedException('Access denied. Admins only.');
      }

      return await this.generateTokensAndSetCookies(
        user._id.toString(),
        user.email,
        role.name,
        user.roleId as unknown as { _id: string; name: string },
        res,
      );
    } catch (error) {
      return ErrorHandlerUtil.handleError(error, 'AuthService.login', 'Failed to login user');
    }
  }

  /**
   * Refresh access token with token rotation
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      if (!refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Refresh token is required');
      }

      // Verify the refresh token
      const payload = this.tokenService.verifyRefreshToken(refreshTokenDto.refreshToken);
      // Get user and verify refresh token matches stored token
      const user = await this.userService.findByEmail(payload.email);
      if (!user || !user.refreshToken || user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User is inactive');
      }

      // Rotate refresh token (generate new pair, invalidate old)
      const newPayload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        roleId: user.roleId._id.toString(),
      };

      const rotationResult = await this.tokenService.rotateRefreshToken(
        refreshTokenDto.refreshToken,
        newPayload,
      );

      // Store new refresh token
      await this.userService.updateRefreshToken(user._id.toString(), rotationResult.refreshToken);

      // Set new cookies
      this.setTokenCookies(rotationResult.accessToken, rotationResult.refreshToken, res);

      return { accessToken: rotationResult.accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return ErrorHandlerUtil.handleError(
        error,
        'AuthService.refreshToken',
        'Failed to refresh token',
      );
    }
  }

  /**
   * Logout user - clear tokens
   */
  async logout(userId: string, res: Response): Promise<{ message: string }> {
    try {
      await this.userService.updateRefreshToken(userId, null);
      this.clearTokenCookies(res);
      return { message: 'Logged out successfully' };
    } catch (error) {
      ErrorHandlerUtil.handleError(error, 'AuthService.logout', 'Failed to logout user');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    try {
      console.log(await this.userService.findOne(userId), 'lu------------');
      return await this.userService.findOne(userId);
    } catch (error) {
      console.log('lu------------error');
      return ErrorHandlerUtil.handleError(
        error,
        'AuthService.getProfile',
        'Failed to get user profile',
      );
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    try {
      return await this.userService.update(userId, updateProfileDto);
    } catch (error) {
      return ErrorHandlerUtil.handleError(
        error,
        'AuthService.updateProfile',
        'Failed to update user profile',
      );
    }
  }

  /**
   * Initiate password reset - send email with reset link
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const normalizedEmail = StringHelper.toLowerCase(forgotPasswordDto.email);

    this.logger.log(
      `[Forgot Password] Processing password reset request for email: ${normalizedEmail}`,
      'AuthService',
    );

    try {
      const user = await this.userService.findByEmail(normalizedEmail);

      // Don't reveal if user exists or not (security best practice)
      if (!user) {
        this.logger.log(
          `[Forgot Password] User not found for email: ${normalizedEmail} (returning success to prevent enumeration)`,
          'AuthService',
        );
        // Still return success to prevent email enumeration
        throw new BadRequestException('Email not found');
      }

      this.logger.log(
        `[Forgot Password] User found, generating reset token for: ${normalizedEmail}`,
        'AuthService',
      );

      // Generate secure reset token
      const resetToken = this.tokenService.generatePasswordResetToken();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

      // Store token in database
      await this.userService.setPasswordResetToken(normalizedEmail, resetToken, resetExpires);

      this.logger.log(
        `[Forgot Password] Reset token generated and stored for: ${normalizedEmail}, expires at: ${resetExpires.toISOString()}`,
        'AuthService',
      );

      // Build reset URL
      const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${resetToken}`;

      // Get user's language preference or default to 'en'
      const userLanguage = (user.language as 'en' | 'es') || 'en';

      // Get translated email subject with fallback
      let emailSubject: string;
      try {
        const translated = this.i18n.translate('email.subject.forgotPassword', {
          lang: userLanguage,
        });

        // Ensure we have a string value
        const translatedString = typeof translated === 'string' ? translated : String(translated);

        // If translation returns the key itself, it means translation not found
        // Use fallback to English or default message
        if (translatedString && translatedString !== 'email.subject.forgotPassword') {
          emailSubject = translatedString;
          this.logger.log(
            `[Forgot Password] Email subject translated to: "${emailSubject}" (lang: ${userLanguage})`,
            'AuthService',
          );
        } else {
          // Fallback to English translation
          this.logger.warn(
            `[Forgot Password] Translation key returned for language ${userLanguage}, falling back to English`,
            'AuthService',
          );
          const englishSubject = this.i18n.translate('email.subject.forgotPassword', {
            lang: 'en',
          });
          const englishString =
            typeof englishSubject === 'string' ? englishSubject : String(englishSubject);
          emailSubject =
            englishString && englishString !== 'email.subject.forgotPassword'
              ? englishString
              : 'Password Reset Request'; // Final fallback
        }
      } catch (error) {
        // If translation fails completely, use default English message
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `[Forgot Password] Failed to translate email subject for language ${userLanguage}: ${errorMessage}, using fallback`,
          error instanceof Error ? error.stack : String(error),
          'AuthService',
        );
        emailSubject = 'Password Reset Request';
      }

      // Prepare template variables
      const templateVariables = {
        userName: user.firstName || user.email.split('@')[0],
        resetUrl,
        expiryTime: this.i18n.translate('email.template.forgotPassword.expiry', {
          lang: userLanguage,
        }),
        currentYear: new Date().getFullYear(),
      };

      // Final safety check: ensure subject is not the translation key
      if (!emailSubject || emailSubject === 'email.subject.forgotPassword') {
        this.logger.error(
          `[Forgot Password] Email subject is invalid: "${emailSubject}", using hardcoded fallback`,
          'AuthService',
        );
        emailSubject = 'Password Reset Request';
      }

      this.logger.log(
        `[Forgot Password] Queuing password reset email to: ${normalizedEmail} (lang: ${userLanguage}, subject: "${emailSubject}")`,
        'AuthService',
      );

      // Enqueue email job (non-blocking, async processing)
      const jobId = await this.emailService.sendTemplatedEmail({
        to: normalizedEmail,
        subject: emailSubject,
        templateName: 'forgot-password',
        templateVariables,
        language: userLanguage,
      });

      this.logger.log(
        `[Forgot Password] Password reset email queued successfully: jobId=${jobId}, email=${normalizedEmail}`,
        'AuthService',
      );

      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Forgot Password] Failed to process password reset request for ${normalizedEmail}: ${errorMessage}`,
        error instanceof Error ? error.stack : String(error),
        'AuthService',
      );
      // Don't reveal errors to prevent email enumeration
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      // Find user by reset token
      const user = await this.userService.findByPasswordResetToken(resetPasswordDto.token);

      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Update password
      await this.userService.updatePassword(user._id.toString(), resetPasswordDto.newPassword);

      // Clear reset token
      await this.userService.clearPasswordResetToken(user._id.toString());

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      return ErrorHandlerUtil.handleError(
        error,
        'AuthService.resetPassword',
        'Failed to reset password',
      );
    }
  }

  /**
   * Generate tokens and set cookies
   */
  private async generateTokensAndSetCookies(
    userId: string,
    email: string,
    roleName: RoleName | undefined,
    roleId: { _id: string; name: string },
    res: Response,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      roleId: roleId._id,
    };

    const { accessToken, refreshToken } = await this.tokenService.generateTokenPair(payload);

    // Store refresh token in database
    await this.userService.updateRefreshToken(userId, refreshToken);

    // Set cookies
    this.setTokenCookies(accessToken, refreshToken, res);

    // Get user for response
    const user = await this.userService.findOne(userId);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: roleName,
      },
    };
  }

  /**
   * Set access and refresh token cookies
   */
  private setTokenCookies(accessToken: string, refreshToken: string, res: Response): void {
    const securityConfig = this.configService.getSecurityConfig();
    const accessTokenCookieConfig = securityConfig.cookies.accessToken;
    const refreshTokenCookieConfig = securityConfig.cookies.refreshToken;

    // Set access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: accessTokenCookieConfig.httpOnly,
      secure: accessTokenCookieConfig.secure,
      sameSite: accessTokenCookieConfig.sameSite,
      maxAge: accessTokenCookieConfig.maxAge,
      path: accessTokenCookieConfig.path,
      ...(accessTokenCookieConfig.domain && { domain: accessTokenCookieConfig.domain }),
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: refreshTokenCookieConfig.httpOnly,
      secure: refreshTokenCookieConfig.secure,
      sameSite: refreshTokenCookieConfig.sameSite,
      maxAge: refreshTokenCookieConfig.maxAge,
      path: refreshTokenCookieConfig.path,
      ...(refreshTokenCookieConfig.domain && { domain: refreshTokenCookieConfig.domain }),
    });
  }

  /**
   * Clear token cookies
   */
  private clearTokenCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  /**
   * Google Sign In - Verify Firebase token and create/login user
   */
  async googleSignIn(googleSignInDto: GoogleSignInDto, res: Response): Promise<AuthResponseDto> {
    try {
      // Verify Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(googleSignInDto.idToken);

      // Extract user information from Firebase token
      const firebaseUid = decodedToken.uid;
      const email = decodedToken.email;
      const emailVerified = decodedToken.email_verified || false;
      const name = (decodedToken.name as string) || '';

      if (!email) {
        throw new UnauthorizedException('Email is required for Google Sign In');
      }

      const normalizedEmail = StringHelper.toLowerCase(email);

      // Split name into firstName and lastName
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if user exists by email or firebaseUid
      let user = await this.userService.findByEmail(normalizedEmail);

      if (!user) {
        // Check if user exists by Firebase UID
        const userByFirebaseUid = await this.userService.findByFirebaseUid(firebaseUid);
        if (userByFirebaseUid) {
          user = userByFirebaseUid;
        }
      }

      if (user) {
        // Existing user - update Firebase UID if not set, and update last login
        if (!user.firebaseUid) {
          user.firebaseUid = firebaseUid;
        }
        user.lastLoginAt = new Date();
        if (emailVerified && !user.isEmailVerified) {
          user.isEmailVerified = true;
        }
        await user.save();

        // Check if user is active
        if (!user.isActive) {
          throw new UnauthorizedException('Account is inactive');
        }

        const role = user.roleId as unknown as RoleDocument;

        if (role.name === RoleName.ADMIN) {
          throw new UnauthorizedException('Do not use this endpoint for admin login');
        }

        return await this.generateTokensAndSetCookies(
          user._id.toString(),
          user.email,
          role.name,
          user.roleId as unknown as { _id: string; name: string },
          res,
        );
      } else {
        // New user - create account
        if (!this.defaultRoleId) {
          throw new Error('Default role not configured. Please run: npm run seed:roles');
        }

        const newUser = await this.userService.create({
          email: normalizedEmail,
          firstName,
          lastName,
          password: undefined, // No password for Firebase users
          firebaseUid,
          roleId: this.defaultRoleId,
          isActive: true,
        });

        // Update email verification status
        if (emailVerified) {
          const userDoc = await this.userService.findByEmail(normalizedEmail);
          if (userDoc) {
            userDoc.isEmailVerified = true;
            await userDoc.save();
          }
        }

        const role = newUser.roleId as unknown as RoleDocument;
        return await this.generateTokensAndSetCookies(
          newUser.id,
          newUser.email,
          role.name,
          newUser.roleId as unknown as { _id: string; name: string },
          res,
        );
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return ErrorHandlerUtil.handleError(
        error,
        'AuthService.googleSignIn',
        'Failed to sign in with Google',
      );
    }
  }

  /**
   * Get frontend URL from config (for password reset links)
   */
  private getFrontendUrl(): string {
    const securityConfig = this.configService.getSecurityConfig();
    // Use first CORS origin as frontend URL
    return securityConfig.cors.origin[0] || 'http://localhost:3000';
  }

  /**
   * Get email queue report (for monitoring)
   */
  async getEmailQueueReport(): Promise<QueueStatsDto> {
    const counts = await this.emailQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );

    return {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
      paused: counts.paused,
    };
  }
}
