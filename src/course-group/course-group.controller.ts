import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CourseGroupService } from './course-group.service';
import { CreateCourseGroupDto } from './dto/create-course-group.dto';
import { UpdateCourseGroupDto } from './dto/update-course-group.dto';

@Controller('course-group')
export class CourseGroupController {
  constructor(private readonly courseGroupService: CourseGroupService) {}

  @Post()
  create(@Body() createCourseGroupDto: CreateCourseGroupDto) {
    return this.courseGroupService.create(createCourseGroupDto);
  }

  @Get()
  findAll() {
    return this.courseGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseGroupService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseGroupDto: UpdateCourseGroupDto) {
    return this.courseGroupService.update(+id, updateCourseGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseGroupService.remove(+id);
  }
}
