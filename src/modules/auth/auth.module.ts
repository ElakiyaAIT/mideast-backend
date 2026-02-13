import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '../../common/config/config.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './services/token.service';
import { FirebaseService } from './services/firebase.service';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';
import { EmailModule } from '../email/email.module';
import { EMAIL_QUEUE } from '../email/constants/email.constants';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    UserModule,
    RoleModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.getJwtConfig();
        return {
          secret: jwtConfig.accessTokenSecret,
          signOptions: {
            expiresIn: jwtConfig.accessTokenExpiration,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService, FirebaseService],
  exports: [AuthService, TokenService, FirebaseService],
})
export class AuthModule {}
