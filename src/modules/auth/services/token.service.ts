import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../../common/config/config.service';
import { JwtPayload } from '../strategies/jwt.strategy';
import { randomBytes } from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRotationResult {
  accessToken: string;
  refreshToken: string;
  previousRefreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate a new access and refresh token pair
   */
  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const jwtConfig = this.configService.getJwtConfig();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.accessTokenSecret,
        expiresIn: jwtConfig.accessTokenExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.refreshTokenSecret,
        expiresIn: jwtConfig.refreshTokenExpiration,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Rotate refresh token - invalidates old token and generates new pair
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    payload: JwtPayload,
  ): Promise<TokenRotationResult> {
    const jwtConfig = this.configService.getJwtConfig();

    // Verify the old refresh token
    try {
      this.jwtService.verify(oldRefreshToken, {
        secret: jwtConfig.refreshTokenSecret,
      });
    } catch {
      throw new Error('Invalid refresh token');
    }

    // Generate new token pair
    const newTokens = await this.generateTokenPair(payload);

    return {
      ...newTokens,
      previousRefreshToken: oldRefreshToken,
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JwtPayload {
    const jwtConfig = this.configService.getJwtConfig();
    return this.jwtService.verify(token, {
      secret: jwtConfig.accessTokenSecret,
    });
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    const jwtConfig = this.configService.getJwtConfig();
    return this.jwtService.verify(token, {
      secret: jwtConfig.refreshTokenSecret,
    });
  }

  /**
   * Generate a secure random token for password reset
   */
  generatePasswordResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Decode token without verification (for inspection)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token);
    } catch {
      return null;
    }
  }
}
