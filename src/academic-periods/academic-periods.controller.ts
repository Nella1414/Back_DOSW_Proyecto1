import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Document } from 'mongoose';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Auth } from '../auth/decorators/auth.decorator';
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
@ApiBearerAuth()
@Controller('academic-periods')
@UseGuards(JwtAuthGuard)
export class AcademicPeriodsController {
  private readonly logger = new Logger(AcademicPeriodsController.name);

  constructor(
    private readonly academicPeriodsService: AcademicPeriodsService,
  ) {}

  /**
   * Create a new academic period
   */
  @Post()
  @Auth('ADMIN')
  @ApiOperation({
    summary: 'Create academic period',
    description: 'Creates a new academic period with unique code validation',
  })
  @ApiResponse({
    status: 201,
    description: 'Academic period created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Academic period code already exists',
  })
  async create(@Body() createAcademicPeriodDto: CreateAcademicPeriodDto) {
    try {
      this.logger.log(
        `Creating new academic period: ${createAcademicPeriodDto.code}`,
      );

      // Validate dates don't overlap
      if (
        createAcademicPeriodDto.startDate &&
        createAcademicPeriodDto.endDate
      ) {
        await this.academicPeriodsService.validatePeriodDates(
          new Date(createAcademicPeriodDto.startDate),
          new Date(createAcademicPeriodDto.endDate),
        );
      }

      const result = await this.academicPeriodsService.create(
        createAcademicPeriodDto,
      );
      const resultDoc = result as unknown as Document & { _id: string };
      this.logger.log(`Academic period created successfully: ${resultDoc._id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error creating academic period: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get all academic periods with pagination and filters
   */
  @Get()
  @Auth('ADMIN', 'DEAN', 'STUDENT')
  @ApiOperation({
    summary: 'Get academic periods',
    description:
      'Retrieves academic periods with optional pagination and filtering',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'year', required: false, description: 'Filter by year' })
  @ApiResponse({
    status: 200,
    description: 'Academic periods retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('year') year?: string,
  ) {
    if (page || limit || status || year) {
      return this.academicPeriodsService.findAllWithFilters(
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 10,
        status,
        year ? parseInt(year) : undefined,
      );
    }
    return this.academicPeriodsService.findAll();
  }

  /**
   * Get the currently active academic period
   */
  @Get('active')
  @ApiOperation({
    summary: 'Get active academic period',
    description: 'Retrieves the currently active academic period',
  })
  @ApiResponse({
    status: 200,
    description: 'Active academic period retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active academic period found',
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
    description:
      'Retrieves all academic periods that currently allow change requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Periods allowing changes retrieved successfully',
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
    description:
      'Retrieves all academic periods that currently have enrollment open',
  })
  @ApiResponse({
    status: 200,
    description: 'Periods with open enrollment retrieved successfully',
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
    description: 'Retrieves a specific academic period by its ID',
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Academic period retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found',
  })
  findOne(@Param('id') id: string) {
    return this.academicPeriodsService.findOne(id);
  }

  /**
   * Update an academic period
   */
  @Patch(':id')
  @Auth('ADMIN')
  @ApiOperation({
    summary: 'Update academic period',
    description: 'Updates an existing academic period with partial data',
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Academic period updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAcademicPeriodDto: UpdateAcademicPeriodDto,
  ) {
    try {
      this.logger.log(`Updating academic period: ${id}`);

      // Validate dates don't overlap if dates are being updated
      if (
        updateAcademicPeriodDto.startDate &&
        updateAcademicPeriodDto.endDate
      ) {
        await this.academicPeriodsService.validatePeriodDates(
          new Date(updateAcademicPeriodDto.startDate),
          new Date(updateAcademicPeriodDto.endDate),
          id,
        );
      }

      const result = await this.academicPeriodsService.update(
        id,
        updateAcademicPeriodDto,
      );
      this.logger.log(`Academic period updated successfully: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error updating academic period ${id}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Set a period as active
   */
  @Patch(':id/activate')
  @Auth('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate academic period',
    description:
      'Sets the specified period as active and deactivates all others',
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Academic period activated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found',
  })
  async setActivePeriod(@Param('id') id: string) {
    try {
      this.logger.log(`Activating academic period: ${id}`);
      const result = await this.academicPeriodsService.setActivePeriod(id);
      this.logger.log(`Academic period activated successfully: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error activating academic period ${id}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Delete an academic period
   */
  @Delete(':id')
  @Auth('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete academic period',
    description: 'Permanently removes an academic period from the system',
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 204,
    description: 'Academic period deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete period with associated data',
  })
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Deleting academic period: ${id}`);
      await this.academicPeriodsService.remove(id);
      this.logger.log(`Academic period deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting academic period ${id}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Check if enrollment is open for a period
   */
  @Get(':id/enrollment-status')
  @ApiOperation({
    summary: 'Check enrollment status',
    description:
      'Checks if enrollment is currently open for the specified period',
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found',
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
    description:
      'Checks if change requests are currently allowed for the specified period',
  })
  @ApiParam({ name: 'id', description: 'Academic period ID' })
  @ApiResponse({
    status: 200,
    description: 'Change requests status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic period not found',
  })
  async checkChangeRequestsStatus(@Param('id') id: string) {
    const allowsChanges =
      await this.academicPeriodsService.allowsChangeRequests(id);
    return { changeRequestsAllowed: allowsChanges };
  }
}
