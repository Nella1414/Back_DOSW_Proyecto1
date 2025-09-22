import { Injectable } from '@nestjs/common';
import { CreateCourseGroupDto } from './dto/create-course-group.dto';
import { UpdateCourseGroupDto } from './dto/update-course-group.dto';

@Injectable()
export class CourseGroupService {
  create(createCourseGroupDto: CreateCourseGroupDto) {
    return 'This action adds a new courseGroup';
  }

  findAll() {
    return `This action returns all courseGroup`;
  }

  findOne(id: number) {
    return `This action returns a #${id} courseGroup`;
  }

  update(id: number, updateCourseGroupDto: UpdateCourseGroupDto) {
    return `This action updates a #${id} courseGroup`;
  }

  remove(id: number) {
    return `This action removes a #${id} courseGroup`;
  }
}
