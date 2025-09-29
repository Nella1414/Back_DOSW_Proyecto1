import { Module } from '@nestjs/common';
import { RolesService } from './services/roles.service';
import { RolesController } from './roles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './entities/role.entity';
import { UserRole, UserRoleSchema } from './entities/user-role.entity';


@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: UserRole.name, schema: UserRoleSchema },
    ])
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports:[RolesService],
})
export class RolesModule {}
