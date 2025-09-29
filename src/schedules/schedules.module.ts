import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleValidationService } from './services/schedule-validation.service';
import { StudentScheduleService } from './services/student-schedule.service';
import { AcademicTrafficLightService } from './services/academic-traffic-light.service';
import { SchedulesController } from './controllers/schedules.controller';
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
  GroupSchedule,
  GroupScheduleSchema,
} from '../group-schedules/entities/group-schedule.entity';
import {
  AcademicPeriod,
  AcademicPeriodSchema,
} from '../academic-periods/entities/academic-period.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: CourseGroup.name, schema: CourseGroupSchema },
      { name: Course.name, schema: CourseSchema },
      { name: GroupSchedule.name, schema: GroupScheduleSchema },
      { name: AcademicPeriod.name, schema: AcademicPeriodSchema },
    ]),
  ],
  controllers: [SchedulesController],
  providers: [
    ScheduleValidationService,
    StudentScheduleService,
    AcademicTrafficLightService,
  ],
  exports: [
    ScheduleValidationService,
    StudentScheduleService,
    AcademicTrafficLightService,
  ],
})
export class SchedulesModule {}
