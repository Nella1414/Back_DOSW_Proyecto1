import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CourseGroupsService } from './services/course-groups.service';
import { CreateCourseGroupDto } from './dto/create-course-group.dto';
import { UpdateCourseGroupDto } from './dto/update-course-group.dto';
import { RequirePermissions } from '../auth/decorators/auth.decorator';
import { Permission } from '../roles/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Course Groups')
@Controller('course-groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CourseGroupsController {
  constructor(private readonly courseGroupsService: CourseGroupsService) {}

  @ApiOperation({
    summary: 'Create course group (ADMIN)',
    description:
      'Administrators can create new course groups for a specific period',
  })
  @ApiResponse({
    status: 201,
    description: 'Course group created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or group already exists',
  })
  @ApiResponse({ status: 404, description: 'Course or period not found' })
  @RequirePermissions(Permission.CREATE_COURSE)
  @Post()
  async create(@Body() createCourseGroupDto: CreateCourseGroupDto) {
    return this.courseGroupsService.create(createCourseGroupDto);
  }

  @ApiOperation({
    summary: 'Get all course groups',
    description:
      'Retrieve all course groups with course and period information',
  })
  @ApiResponse({
    status: 200,
    description: 'Course groups retrieved successfully',
  })
  @RequirePermissions(Permission.READ_COURSE)
  @Get()
  async findAll() {
    return this.courseGroupsService.findAll();
  }

  @ApiOperation({
    summary: 'Get available course groups',
    description: 'Get course groups with available spots for enrollment',
  })
  @ApiQuery({ name: 'courseId', type: 'string', required: false })
  @ApiQuery({ name: 'periodId', type: 'string', required: false })
  @ApiResponse({
    status: 200,
    description: 'Available groups retrieved successfully',
  })
  @Get('available')
  async getAvailable(
    @Query('courseId') courseId?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.courseGroupsService.getAvailableGroups(courseId, periodId);
  }

  @ApiOperation({
    summary: 'Get course groups by period',
    description: 'Retrieve all course groups for a specific academic period',
  })
  @ApiParam({ name: 'periodId', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Course groups retrieved successfully',
  })
  @RequirePermissions(Permission.READ_COURSE)
  @Get('period/:periodId')
  async findByPeriod(@Param('periodId') periodId: string) {
    return this.courseGroupsService.findByPeriod(periodId);
  }

  @ApiOperation({
    summary: 'Get course groups by course',
    description: 'Retrieve all groups for a specific course',
  })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiQuery({ name: 'periodId', type: 'string', required: false })
  @ApiResponse({
    status: 200,
    description: 'Course groups retrieved successfully',
  })
  @RequirePermissions(Permission.READ_COURSE)
  @Get('course/:courseId')
  async findByCourse(
    @Param('courseId') courseId: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.courseGroupsService.findByCourse(courseId, periodId);
  }

  @ApiOperation({
    summary: 'Get course group details',
    description: 'Get detailed information about a specific course group',
  })
  @ApiParam({ name: 'id', description: 'Course group ID' })
  @ApiResponse({ status: 200, description: 'Course group details retrieved' })
  @ApiResponse({ status: 404, description: 'Course group not found' })
  @RequirePermissions(Permission.READ_COURSE)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.courseGroupsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update course group (ADMIN)',
    description:
      'Update course group information including capacity and professor',
  })
  @ApiParam({ name: 'id', description: 'Course group ID' })
  @ApiResponse({
    status: 200,
    description: 'Course group updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid update data or conflicts' })
  @ApiResponse({ status: 404, description: 'Course group not found' })
  @RequirePermissions(Permission.UPDATE_COURSE)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCourseGroupDto: UpdateCourseGroupDto,
  ) {
    return this.courseGroupsService.update(id, updateCourseGroupDto);
  }

  @ApiOperation({
    summary: 'Delete course group (ADMIN)',
    description: 'Delete a course group (only if no students are enrolled)',
  })
  @ApiParam({ name: 'id', description: 'Course group ID' })
  @ApiResponse({
    status: 200,
    description: 'Course group deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete group with enrolled students',
  })
  @ApiResponse({ status: 404, description: 'Course group not found' })
  @RequirePermissions(Permission.DELETE_COURSE)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.courseGroupsService.remove(id);
  }

  @ApiOperation({
    summary: 'Update enrollment count',
    description: 'Manually update the enrollment count for a course group',
  })
  @ApiParam({ name: 'id', description: 'Course group ID' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment count updated successfully',
  })
  @RequirePermissions(Permission.UPDATE_COURSE)
  @Patch(':id/update-enrollment-count')
  async updateEnrollmentCount(@Param('id') id: string) {
    await this.courseGroupsService.updateEnrollmentCount(id);
    return { message: 'Enrollment count updated successfully' };
  }
}
