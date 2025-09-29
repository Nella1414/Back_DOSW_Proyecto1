import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseGroup, CourseGroupSchema } from './entities/course-group.entity';
import { CourseGroupsService } from './services/course-groups.service';
import { CourseGroupsController } from './course-groups.controller';
import { Course, CourseSchema } from '../courses/entities/course.entity';
import { AcademicPeriod, AcademicPeriodSchema } from '../academic-periods/entities/academic-period.entity';
import { GroupSchedule, GroupScheduleSchema } from '../group-schedules/entities/group-schedule.entity';
import { Enrollment, EnrollmentSchema } from '../enrollments/entities/enrollment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseGroup.name, schema: CourseGroupSchema },
      { name: Course.name, schema: CourseSchema },
      { name: AcademicPeriod.name, schema: AcademicPeriodSchema },
      { name: GroupSchedule.name, schema: GroupScheduleSchema },
      { name: Enrollment.name, schema: EnrollmentSchema }
    ])
  ],
  controllers: [CourseGroupsController],
  providers: [CourseGroupsService],
  exports: [MongooseModule, CourseGroupsService]
})
export class CourseGroupsModule {}