import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '../../../common/config/config.service';
import { UserService } from '../../user/user.service';
import { Types } from 'mongoose';

export interface JwtPayload {
  sub: string;
  email: string;
  roleId: string;
}

/**
 * Custom extractor to get JWT from cookies or Authorization header
 */
const cookieExtractor = (req: Request): string | null => {
  let token: string | null = null;

  if (req && req.cookies) {
    token = (req.cookies['accessToken'] as string) || null;
  }

  // Fallback to Authorization header if cookie not found
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
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
    // Fetch user to verify they exist and are active
    const user = await this.userService.findOne(payload.sub);
    console.log(payload, '---------------pub123');
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or does not exist');
    }

    // Return minimal user info with roleId
    // Note: We use the roleId from payload for performance (avoid extra DB query)
    return {
      id: user.id,
      email: user.email,
      roleId: new Types.ObjectId(payload.roleId),
    };
  }
}
