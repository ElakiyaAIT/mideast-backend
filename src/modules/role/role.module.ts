import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schemas/role.schema';
import { RoleService } from './role.service';
import { RoleCacheService } from './role-cache.service';
import { RoleController } from './role.controller';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])],
  controllers: [RoleController],
  providers: [RoleService, RoleCacheService],
  exports: [RoleService, RoleCacheService, MongooseModule],
})
export class RoleModule {}
