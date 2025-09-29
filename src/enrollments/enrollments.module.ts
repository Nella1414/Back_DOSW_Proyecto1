import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentsService } from './services/enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { Enrollment, EnrollmentSchema } from './entities/enrollment.entity';
import { Student, StudentSchema } from '../students/entities/student.entity';
import { CourseGroup, CourseGroupSchema } from '../course-groups/entities/course-group.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Student.name, schema: StudentSchema },
      { name: CourseGroup.name, schema: CourseGroupSchema }
    ])
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [MongooseModule, EnrollmentsService]
})
export class EnrollmentsModule {}
