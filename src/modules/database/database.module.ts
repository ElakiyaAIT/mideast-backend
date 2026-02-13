import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '../../common/config/config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.getDatabaseConfig();
        return {
          uri: dbConfig.uri,
          ...dbConfig.options,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
