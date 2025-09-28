import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student, StudentSchema } from './entities/student.entity';
import { StudentScheduleService } from './services/student-schedule.service';
import { Enrollment, EnrollmentSchema } from '../enrollments/entities/enrollment.entity';
import { CourseGroup, CourseGroupSchema } from '../course-groups/entities/course-group.entity';
import { Course, CourseSchema } from '../courses/entities/course.entity';
import { GroupSchedule, GroupScheduleSchema } from '../group-schedules/entities/group-schedule.entity';
import { AcademicPeriod, AcademicPeriodSchema } from '../academic-periods/entities/academic-period.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: CourseGroup.name, schema: CourseGroupSchema },
      { name: Course.name, schema: CourseSchema },
      { name: GroupSchedule.name, schema: GroupScheduleSchema },
      { name: AcademicPeriod.name, schema: AcademicPeriodSchema }
    ])
  ],
  controllers: [StudentsController],
  providers: [StudentsService, StudentScheduleService],
  exports: [StudentsService, StudentScheduleService],
})
export class StudentsModule {}
