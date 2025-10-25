import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';

import { AppController } from './app.controller';
import { AppService } from './services/app.service';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { FacultyModule } from '../faculty/faculty.module';
import { ProgramsModule } from '../programs/programs.module';
import { AcademicPeriodsModule } from '../academic-periods/academic-periods.module';
import { CoursesModule } from '../courses/courses.module';
import { CourseGroupsModule } from '../course-groups/course-groups.module';
import { GroupSchedulesModule } from '../group-schedules/group-schedules.module';
import { StudentsModule } from '../students/students.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { WaitlistsModule } from '../waitlists/waitlists.module';
import { AcademicTrafficLightModule } from '../academic-traffic-light/academic-traffic-light.module';
import { ChangeRequestsModule } from '../change-requests/change-requests.module';
import { ChangeWindowsModule } from '../change-windows/change-windows.module';
import { ReportsModule } from '../reports/reports.module';
import { SchedulesModule } from '../schedules/schedules.module';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    //Add rate limiting to all endpoints
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // one minute
        limit: 200, // 200 requests per minute
      },
    ]),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    // Configuración i18n
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '..', 'i18n'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),

    AuthModule,
    UsersModule,
    RolesModule,
    FacultyModule,
    ProgramsModule,
    AcademicPeriodsModule,
    CoursesModule,
    CourseGroupsModule,
    GroupSchedulesModule,
    StudentsModule,
    EnrollmentsModule,
    WaitlistsModule,
    AcademicTrafficLightModule,
    ChangeRequestsModule,
    ChangeWindowsModule,
    ReportsModule,
    SchedulesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
