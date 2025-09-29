import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AcademicPeriodsService } from './services/academic-periods.service';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';

/**
 * Academic Periods Controller
 *
 * Handles HTTP requests for academic period management
 * Provides endpoints for CRUD operations and period status management
 */
@ApiTags('Academic Periods')
@Controller('academic-periods')
export class AcademicPeriodsController {
  constructor(private readonly academicPeriodsService: AcademicPeriodsService) {}

  /**
   * Create a new academic period
   */
  @Post()
  @ApiOperation({
    summary: 'Create academic period',
    description: 'Creates a new academic period with unique code validation'
  })
  @ApiResponse({
    status: 201,
    description: 'Academic period created successfully'
  })
  @ApiResponse({
    status: 409,
    description: 'Academic period code already exists'
  })
  create(@Body() createAcademicPeriodDto: CreateAcademicPeriodDto) {
    return this.academicPeriodsService.create(createAcademicPeriodDto);
  }

  /**
   * Get all academic periods
   */
  @Get()
  @ApiOperation({
    summary: 'Get all academic periods',
    description: 'Retrieves all academic periods ordered by start date (newest first)'
  })
  @ApiResponse({
    status: 200,
    description: 'Academic periods retrieved successfully'
  })
  findAll() {
    return this.academicPeriodsService.findAll();
  }

  /**
   * Get the currently active academic period
   */
  @Get('active')
  @ApiOperation({
    summary: 'Get active academic period',
    description: 'Retrieves the currently active academic period'
  })
  @ApiResponse({
    status: 200,
    description: 'Active academic period retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'No active academic period found'
  })
  getActivePeriod() {
    return this.academicPeriodsService.getActivePeriod();
  }

  /**
   * Get periods that allow change requests
   */
  @Get('allowing-changes')
  @ApiOperation({
    summary: 'Get periods allowing change requests',
    description: 'Retrieves all academic periods that currently allow change requests'
  })
  @ApiResponse({
    status: 200,
    description: 'Periods allowing changes retrieved successfully'
  })
  getPeriodsAllowingChanges() {
    return this.academicPeriodsService.getPeriodsAllowingChanges();
  }

  /**
   * Get periods with open enrollment
   */
  @Get('enrollment-open')
  @ApiOperation({
    summary: 'Get periods with open enrollment',
    description: 'Retrieves all academic periods that currently have enrollment open'
  })
  @ApiResponse({
    status: 200,
    description: 'Periods with open enrollment retrieved successfully'
  })
  getPeriodsWithOpenEnrollment() {
    return this.academicPeriodsService.getPeriodsWithOpenEnrollment();
  }

  /**
   * Get academic period by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get academic period by ID',
    description: 'Retrieves a specific academic period by its ID'
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Academic period retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found'
  })
  findOne(@Param('id') id: string) {
    return this.academicPeriodsService.findOne(id);
  }

  /**
   * Update an academic period
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update academic period',
    description: 'Updates an existing academic period with partial data'
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Academic period updated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found'
  })
  update(@Param('id') id: string, @Body() updateAcademicPeriodDto: UpdateAcademicPeriodDto) {
    return this.academicPeriodsService.update(id, updateAcademicPeriodDto);
  }

  /**
   * Set a period as active
   */
  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate academic period',
    description: 'Sets the specified period as active and deactivates all others'
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Academic period activated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found'
  })
  setActivePeriod(@Param('id') id: string) {
    return this.academicPeriodsService.setActivePeriod(id);
  }

  /**
   * Delete an academic period
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete academic period',
    description: 'Permanently removes an academic period from the system'
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 204,
    description: 'Academic period deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found'
  })
  remove(@Param('id') id: string) {
    return this.academicPeriodsService.remove(id);
  }

  /**
   * Check if enrollment is open for a period
   */
  @Get(':id/enrollment-status')
  @ApiOperation({
    summary: 'Check enrollment status',
    description: 'Checks if enrollment is currently open for the specified period'
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment status retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found'
  })
  async checkEnrollmentStatus(@Param('id') id: string) {
    const isOpen = await this.academicPeriodsService.isEnrollmentOpen(id);
    return { enrollmentOpen: isOpen };
  }

  /**
   * Check if change requests are allowed for a period
   */
  @Get(':id/change-requests-status')
  @ApiOperation({
    summary: 'Check change requests status',
    description: 'Checks if change requests are currently allowed for the specified period'
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Change requests status retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found'
  })
  async checkChangeRequestsStatus(@Param('id') id: string) {
    const allowsChanges = await this.academicPeriodsService.allowsChangeRequests(id);
    return { changeRequestsAllowed: allowsChanges };
  }
}