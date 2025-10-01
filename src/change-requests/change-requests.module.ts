import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChangeRequestsService } from './services/change-requests.service';
import { ChangeRequestsController } from './change-requests.controller';
import {
  ChangeRequest,
  ChangeRequestSchema,
} from './entities/change-request.entity';
import { Student, StudentSchema } from '../students/entities/student.entity';
import {
  CourseGroup,
  CourseGroupSchema,
} from '../course-groups/entities/course-group.entity';
import { Course, CourseSchema } from '../courses/entities/course.entity';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/entities/enrollment.entity';
import {
  AcademicPeriod,
  AcademicPeriodSchema,
} from '../academic-periods/entities/academic-period.entity';
import { Program, ProgramSchema } from '../programs/entities/program.entity';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [
    SchedulesModule,
    MongooseModule.forFeature([
      { name: ChangeRequest.name, schema: ChangeRequestSchema },
      { name: Student.name, schema: StudentSchema },
      { name: CourseGroup.name, schema: CourseGroupSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: AcademicPeriod.name, schema: AcademicPeriodSchema },
      { name: Program.name, schema: ProgramSchema },
    ]),
  ],
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsService],
  exports: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
