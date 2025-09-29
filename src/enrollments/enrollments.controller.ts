import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EnrollmentsService } from './services/enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Post(':studentCode/enroll/:groupId')
  enrollStudent(@Param('studentCode') studentCode: string, @Param('groupId') groupId: string) {
    return this.enrollmentsService.enrollStudentInCourse(studentCode, groupId);
  }

  @Get()
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @Get('student/:studentCode')
  findByStudent(@Param('studentCode') studentCode: string) {
    return this.enrollmentsService.findByStudent(studentCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnrollmentDto: UpdateEnrollmentDto) {
    return this.enrollmentsService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(id);
  }
}
