import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { SubjectsModule } from './subjects/subjects.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  UsersModule,
  GroupsModule,
  SubjectsModule,
  AuthModule,
     MongooseModule.forRoot(
      'mongodb+srv://SIRHAAdmin:SIRHAAdmin@sirha.zbthjmo.mongodb.net/?retryWrites=true&w=majority&appName=SIRHA',
    ),
  ],
})
export class AppModule {}
