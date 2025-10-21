import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { AcademicTrafficLightService } from './services/academic-traffic-light.service';
import { AcademicTrafficLightController } from './academic-traffic-light.controller';
import { Student, StudentSchema } from '../students/entities/student.entity';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/entities/enrollment.entity';
import {
  CourseGroup,
  CourseGroupSchema,
} from '../course-groups/entities/course-group.entity';
import { Course, CourseSchema } from '../courses/entities/course.entity';
import {
  AcademicPeriod,
  AcademicPeriodSchema,
} from '../academic-periods/entities/academic-period.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: CourseGroup.name, schema: CourseGroupSchema },
      { name: Course.name, schema: CourseSchema },
      { name: AcademicPeriod.name, schema: AcademicPeriodSchema },
    ]),
    RolesModule,
    // Cache configuration for academic traffic light reports
    CacheModule.register({
      ttl: 300, // Time to live: 5 minutes (300 seconds)
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [AcademicTrafficLightController],
  providers: [AcademicTrafficLightService],
  exports: [AcademicTrafficLightService],
})
export class AcademicTrafficLightModule {}
