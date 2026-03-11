import { Controller, Post, Get, Patch, Body, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthResponseDto, QueueStatsDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { AdminJwtAuthGuard } from '@/common/guards/admin-jwt.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { AdminRoute } from '@/common/decorators/admin-route.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto, res);
  }

  @Public()
  @Post('login')
  login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto, res);
  }

  @Public()
  @Post('admin-login')
  adminLogin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.adminLogin(loginDto, res);
  }

  @Public()
  @Post('refresh')
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: { cookies?: { refreshToken?: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    accessToken: string;
  }> {
    // Prefer cookie over body for refresh token (more secure)
    // Reads web cookie 'refreshToken'
    const token = req.cookies?.refreshToken || refreshTokenDto.refreshToken;
    return this.authService.refreshToken({ refreshToken: token }, res);
  }
  @Public()
  @Post('admin-refresh')
  adminRefresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: { cookies?: { adminRefreshToken?: string } }, // <-- reads admin cookie
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    // Reads admin cookie 'adminRefreshToken'
    const token = req.cookies?.adminRefreshToken || refreshTokenDto.refreshToken;
    return this.authService.refreshToken({ refreshToken: token }, res, true); // <-- isAdmin=true
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @Request() req: { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    message: string;
  }> {
    return this.authService.logout(req.user.id, res);
  }

  @AdminRoute()
  @UseGuards(AdminJwtAuthGuard, AdminGuard)
  @Post('admin-logout')
  adminLogout(
    @Request() req: { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    return this.authService.logout(req.user.id, res, true); // isAdmin = true
  }
  @UseGuards(JwtAuthGuard) // web profile — reads 'accessToken' cookie
  @Get('profile')
  getProfile(@Request() req: { user: { id: string } }): Promise<UserResponseDto> {
    return this.authService.getProfile(req.user.id);
  }

  @AdminRoute()
  @UseGuards(AdminJwtAuthGuard) // admin profile — reads 'adminAccessToken' cookie
  @Get('admin-profile')
  getAdminProfile(@Request() req: { user: { id: string } }): Promise<UserResponseDto> {
    return this.authService.getProfile(req.user.id);
  }

  @AdminRoute()
  @UseGuards(AdminJwtAuthGuard)
  @Patch('admin-profile')
  updateAdminProfile(
    @Request() req: { user: { id: string } },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour to prevent abuse
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{
    message: string;
  }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{
    message: string;
  }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('google-signin')
  googleSignIn(
    @Body() googleSignInDto: GoogleSignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.googleSignIn(googleSignInDto, res);
  }

  @Public()
  @Get('email-reports')
  getEmailQueueReport(): Promise<QueueStatsDto> {
    return this.authService.getEmailQueueReport();
  }
}
