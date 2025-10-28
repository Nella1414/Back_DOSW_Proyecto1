import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  HttpStatus,
  HttpException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StudentScheduleService } from '../services/student-schedule.service';
import { ScheduleValidationService } from '../services/schedule-validation.service';
import { AcademicTrafficLightService } from '../../academic-traffic-light/services/academic-traffic-light.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import {
  Student,
  StudentDocument,
} from '../../students/entities/student.entity';

@ApiTags('Student Schedules')
@ApiBearerAuth()
@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  private readonly logger = new Logger(SchedulesController.name);

  constructor(
    private readonly studentScheduleService: StudentScheduleService,
    private readonly scheduleValidationService: ScheduleValidationService,
    private readonly academicTrafficLightService: AcademicTrafficLightService,
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
  ) {}

  /**
   * Helper method to validate if the requested userId belongs to the authenticated user
   * Handles both student code (e.g., "S1S202400018") and externalId
   */
  private async validateUserAccess(
    queryUserId: string,
    authenticatedUserId: string,
    userRoles: string[],
  ): Promise<boolean> {
    // Admin and Dean can access any user's data
    if (userRoles.includes('ADMIN') || userRoles.includes('DEAN')) {
      return true;
    }

    // Direct externalId match
    if (queryUserId === authenticatedUserId) {
      return true;
    }

    // Check if queryUserId is a student code that belongs to this user
    const student = await this.studentModel
      .findOne({ code: queryUserId })
      .exec();

    if (student && student.externalId === authenticatedUserId) {
      return true;
    }

    return false;
  }

  @Get('current')
  @Auth('STUDENT', 'ADMIN', 'DEAN')
  @ApiOperation({ summary: 'Get current schedule for authenticated student' })
  @ApiResponse({
    status: 200,
    description: 'Current schedule retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Unauthorized access attempt' })
  @ApiResponse({ status: 404, description: 'No enrollments found' })
  async getCurrentSchedule(
    @Request() req: any,
    @Query('userId') queryUserId?: string,
  ) {
    // * PERFORMANCE: Track response time for monitoring
    const startTime = Date.now();
    const authenticatedUserId = req.user?.externalId;
    const userRoles = req.user?.roles || [];

    let targetUserId = authenticatedUserId;

    // ! AUTHORIZATION: Validate cross-student access
    if (queryUserId) {
      if (
        !userRoles.includes('ADMIN') &&
        !userRoles.includes('DEAN') &&
        queryUserId !== authenticatedUserId
      ) {
        // ! SECURITY: Log unauthorized access attempts for audit trail
        this.logger.warn(
          `Unauthorized access attempt: User ${authenticatedUserId} tried to access ${queryUserId}'s schedule`,
        );
        throw new ForbiddenException('You can only access your own schedule');
      }
      targetUserId = queryUserId;
    }

    try {
      const schedule =
        await this.studentScheduleService.getCurrentSchedule(targetUserId);

      if (!schedule.schedule || schedule.schedule.length === 0) {
        return {
          schedule: [],
          emptySchedule: true,
          message: 'No enrollments found for current period',
          studentId: targetUserId,
          currentPeriod: schedule.period || null,
        };
      }

      const conflicts =
        await this.scheduleValidationService.detectScheduleConflicts(
          schedule.schedule,
        );

      const latency = Date.now() - startTime;
      this.logger.log(
        `Schedule request for user ${targetUserId} completed in ${latency}ms`,
      );

      return {
        ...schedule,
        conflicts: conflicts || [],
        emptySchedule: false,
        latency: latency,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving schedule for user ${targetUserId}: ${(error as Error).message}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      if ((error as Error).message.includes('not found')) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        `Error retrieving schedule: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('historical')
  @Auth('STUDENT', 'ADMIN', 'DEAN')
  @ApiOperation({ summary: 'Get historical schedules for closed periods' })
  @ApiResponse({
    status: 200,
    description: 'Historical schedules retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid period or period not closed',
  })
  async getHistoricalSchedules(
    @Request() req: any,
    @Query('userId') queryUserId?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    const authenticatedUserId = req.user?.externalId;
    const userRoles = req.user?.roles || [];

    let targetUserId = authenticatedUserId;

    if (queryUserId) {
      if (
        !userRoles.includes('ADMIN') &&
        !userRoles.includes('DEAN') &&
        queryUserId !== authenticatedUserId
      ) {
        this.logger.warn(
          `Unauthorized access attempt: User ${authenticatedUserId} tried to access ${queryUserId}'s historical schedules`,
        );
        throw new ForbiddenException(
          'You can only access your own historical schedules',
        );
      }
      targetUserId = queryUserId;
    }

    try {
      const historicalData =
        await this.studentScheduleService.getHistoricalSchedules(
          targetUserId,
          fromDate,
          toDate,
        );

      if (!historicalData.periods || historicalData.periods.length === 0) {
        return {
          periods: [],
          emptyHistory: true,
          message: 'No historical academic data found',
          studentId: targetUserId,
        };
      }

      return {
        ...historicalData,
        emptyHistory: false,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving historical schedules for user ${targetUserId}: ${(error as Error).message}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      if (
        (error as Error).message.includes('Invalid period') ||
        (error as Error).message.includes('not closed')
      ) {
        throw new HttpException(
          (error as Error).message,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        `Error retrieving historical schedules: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('historical/period')
  @Auth('STUDENT', 'ADMIN', 'DEAN')
  @ApiOperation({
    summary: 'Get specific historical schedule for a closed period',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical schedule retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Period is not closed' })
  async getHistoricalScheduleByPeriod(
    @Request() req: any,
    @Query('periodId') periodId: string,
    @Query('userId') queryUserId?: string,
  ) {
    const authenticatedUserId = req.user?.externalId;
    const userRoles = req.user?.roles || [];

    // Default to authenticated user's externalId
    let targetUserId = authenticatedUserId;

    if (queryUserId) {
      const hasAccess = await this.validateUserAccess(
        queryUserId,
        authenticatedUserId,
        userRoles,
      );

      if (!hasAccess) {
        this.logger.warn(
          `Unauthorized access attempt: User ${authenticatedUserId} tried to access ${queryUserId}'s historical schedule`,
        );
        throw new ForbiddenException(
          'You can only access your own historical schedules',
        );
      }

      // Use queryUserId as-is (service handles both student code and externalId)
      targetUserId = queryUserId;
    }

    try {
      const isValidPeriod =
        await this.scheduleValidationService.validateClosedPeriod(periodId);

      if (!isValidPeriod) {
        this.logger.warn(
          `Access attempt to non-closed period ${periodId} by user ${authenticatedUserId}`,
        );
        throw new HttpException(
          'Period is not closed or does not exist',
          HttpStatus.BAD_REQUEST,
        );
      }

      const historicalSchedule =
        await this.studentScheduleService.getHistoricalScheduleByPeriod(
          targetUserId,
          periodId,
        );

      return historicalSchedule;
    } catch (error) {
      this.logger.error(
        `Error retrieving historical schedule for period ${periodId}: ${(error as Error).message}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      if (
        (error as Error).message.includes('not closed') ||
        (error as Error).message.includes('does not exist')
      ) {
        throw new HttpException(
          (error as Error).message,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        `Error retrieving historical schedule: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('traffic-light')
  @Auth('STUDENT', 'ADMIN', 'DEAN')
  @ApiOperation({ summary: 'Get academic traffic light status' })
  @ApiResponse({
    status: 200,
    description: 'Academic traffic light retrieved successfully',
  })
  async getAcademicTrafficLight(
    @Request() req: any,
    @Query('userId') queryUserId?: string,
    @Query('details') includeDetails?: string,
  ) {
    const authenticatedUserId = req.user?.externalId;
    const userRoles = req.user?.roles || [];

    let targetUserId = authenticatedUserId;

    if (queryUserId) {
      if (
        !userRoles.includes('ADMIN') &&
        !userRoles.includes('DEAN') &&
        queryUserId !== authenticatedUserId
      ) {
        this.logger.warn(
          `Unauthorized access attempt: User ${authenticatedUserId} tried to access ${queryUserId}'s traffic light`,
        );
        throw new ForbiddenException(
          'You can only access your own academic status',
        );
      }
      targetUserId = queryUserId;
    }

    try {
      const includeBreakdown = includeDetails === 'true';
      const trafficLight =
        await this.academicTrafficLightService.getAcademicTrafficLight(
          targetUserId,
          includeBreakdown,
        );

      return trafficLight;
    } catch (error) {
      this.logger.error(
        `Error retrieving academic traffic light for user ${targetUserId}: ${(error as Error).message}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error retrieving academic traffic light: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
