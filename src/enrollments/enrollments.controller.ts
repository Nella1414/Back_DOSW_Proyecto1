import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
} from '@nestjs/common';
import { EnrollmentsService } from './services/enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Controller('enrollments')
export class EnrollmentsController {
  private readonly logger = new Logger(EnrollmentsController.name);

  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Post(':studentCode/enroll/:groupId')
  async enrollStudent(
    @Param('studentCode') studentCode: string,
    @Param('groupId') groupId: string,
  ) {
    this.logger.log(
      `[ENROLLMENT REQUEST] Student: ${studentCode}, Group: ${groupId}`,
    );
    const result = await this.enrollmentsService.enrollStudentInCourse(
      studentCode,
      groupId,
    );
    this.logger.log(
      `[ENROLLMENT SUCCESS] Created enrollment ${(result as any)._id || 'unknown'} for student ${studentCode} in group ${groupId}`,
    );
    return result;
  }

  @Get()
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @Get('student/:studentCode')
  findByStudent(@Param('studentCode') studentCode: string) {
    return this.enrollmentsService.findByStudent(studentCode);
  }

  @Get('student/:studentCode/active')
  findActiveEnrollmentsByStudent(@Param('studentCode') studentCode: string) {
    this.logger.log(
      `[GET ACTIVE ENROLLMENTS] Fetching active enrollments for student: ${studentCode}`,
    );
    return this.enrollmentsService.findActiveEnrollmentsByStudent(studentCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(id);
  }

  @Delete(':studentCode/unenroll/:groupId')
  async unenrollStudent(
    @Param('studentCode') studentCode: string,
    @Param('groupId') groupId: string,
  ) {
    this.logger.log(
      `[UNENROLL REQUEST] Student: ${studentCode}, Group: ${groupId}`,
    );
    const result = await this.enrollmentsService.unenrollStudentFromCourse(
      studentCode,
      groupId,
    );
    this.logger.log(
      `[UNENROLL SUCCESS] Removed enrollment for student ${studentCode} from group ${groupId}`,
    );
    return result;
  }
}
