import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseGroupDto } from './create-course-group.dto';

export class UpdateCourseGroupDto extends PartialType(CreateCourseGroupDto) {}