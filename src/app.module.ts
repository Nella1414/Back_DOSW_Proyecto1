import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { SubjectsModule } from './subjects/subjects.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  UsersModule,
  GroupsModule,
  SubjectsModule,
  AuthModule,
  AdminModule,
  MongooseModule.forRoot(process.env.MONGO_URI || ''),
  ],
})
export class AppModule {}
