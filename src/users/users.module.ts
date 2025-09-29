import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from './entities/user.entity';

@Module({
  imports:[
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      }

    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [MongooseModule, UsersService]
})
export class UsersModule {}
