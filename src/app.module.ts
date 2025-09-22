import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';


import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ProgramAccesModule } from './program-acces/program-acces.module';
import { FacultyModule } from './faculty/faculty.module';
import { ProgramsModule } from './programs/programs.module';
import { CoursesModule } from './courses/courses.module';
import { CourseGroupModule } from './course-group/course-group.module';
import { GroupSchedualesModule } from './group-scheduales/group-scheduales.module';
import { StudentsModule } from './students/students.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { WaitlistsModule } from './waitlists/waitlists.module';
import { AcademicTrafficLightModule } from './academic-traffic-light/academic-traffic-light.module';
import { ChangeRequestsModule } from './change-requests/change-requests.module';
import { ChangeWindowsModule } from './change-windows/change-windows.module';
import { RequestEventsModule } from './request-events/request-events.module';
import { ReportsModule } from './reports/reports.module';


import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
  
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    AuthModule,
    UsersModule,
    RolesModule,
    ProgramAccesModule,
    FacultyModule,
    ProgramsModule,
    CoursesModule,
    CourseGroupModule,
    GroupSchedualesModule,
    StudentsModule,
    EnrollmentsModule,
    WaitlistsModule,
    AcademicTrafficLightModule,
    ChangeRequestsModule,
    ChangeWindowsModule,
    RequestEventsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}