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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { EnrollmentsService } from './services/enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  private readonly logger = new Logger(EnrollmentsController.name);

  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new enrollment',
    description: 'Creates a new enrollment record for a student in a course',
  })
  @ApiBody({ type: CreateEnrollmentDto })
  @ApiResponse({
    status: 201,
    description: 'Enrollment successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid enrollment data' })
  @ApiResponse({ status: 409, description: 'Enrollment already exists' })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Post(':studentCode/enroll/:groupId')
  @ApiOperation({
    summary: 'Enroll student in course group',
    description: 'Enrolls a student in a specific course group',
  })
  @ApiParam({ name: 'studentCode', description: 'Student code' })
  @ApiParam({ name: 'groupId', description: 'Course group ID' })
  @ApiResponse({
    status: 201,
    description: 'Student successfully enrolled in the course group',
  })
  @ApiResponse({ status: 404, description: 'Student or group not found' })
  @ApiResponse({ status: 409, description: 'Student already enrolled' })
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
  @ApiOperation({
    summary: 'Get all enrollments',
    description: 'Retrieves a list of all enrollments in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of enrollments retrieved successfully',
  })
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @Get('student/:studentCode')
  @ApiOperation({
    summary: 'Get enrollments by student',
    description: 'Retrieves all enrollments for a specific student',
  })
  @ApiParam({ name: 'studentCode', description: 'Student code' })
  @ApiResponse({
    status: 200,
    description: 'Student enrollments retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
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
  @ApiOperation({
    summary: 'Get enrollment by ID',
    description: 'Retrieves a specific enrollment by its ID',
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment found',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update enrollment',
    description: 'Updates an existing enrollment by ID',
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiBody({ type: UpdateEnrollmentDto })
  @ApiResponse({
    status: 200,
    description: 'Enrollment successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete enrollment',
    description: 'Removes an enrollment from the system',
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
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
