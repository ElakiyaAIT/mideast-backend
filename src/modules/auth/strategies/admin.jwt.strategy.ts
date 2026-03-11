// src/modules/auth/strategies/admin-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '../../../common/config/config.service';
import { UserService } from '../../user/user.service';
import { Types } from 'mongoose';
import { JwtPayload } from './jwt.strategy';

const adminCookieExtractor = (req: Request): string | null => {
  let token: string | null = null;

  if (req?.cookies) {
    // Only reads the ADMIN-specific cookie name
    token = (req.cookies['adminAccessToken'] as string) || null;
  }

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  return token;
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  // <-- named strategy
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        adminCookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getJwtConfig().accessTokenSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<{
    id: string;
    email: string;
    roleId: Types.ObjectId;
  }> {
    const user = await this.userService.findOne(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or does not exist');
    }

    return {
      id: user.id,
      email: user.email,
      roleId: new Types.ObjectId(payload.roleId),
    };
  }
}
