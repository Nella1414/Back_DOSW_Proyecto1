import { Module } from '@nestjs/common';
import { CourseGroupService } from './course-group.service';
import { CourseGroupController } from './course-group.controller';

@Module({
  controllers: [CourseGroupController],
  providers: [CourseGroupService],
})
export class CourseGroupModule {}
