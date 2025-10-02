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
  Param,
} from '@nestjs/common';
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

/**
 * Controller responsible for managing student schedules and academic status.
 * Provides endpoints for retrieving current and historical schedules, as well as academic traffic light status.
 * Enforces role-based access for STUDENT, ADMIN, and DEAN.
 */
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
  ) {}

  /**
   * @module SchedulesController
   * @description
   * This controller manages student schedules, including current and historical schedules,
   * as well as academic traffic light status. It enforces role-based access control for
   * students, admins, and deans, and provides endpoints for retrieving and validating
   * schedule data.
   *
   * ## Endpoints
   *
   * ### GET /schedules/current
   * Retrieves the current academic schedule for the authenticated student.
   * - **Roles:** STUDENT, ADMIN, DEAN
   * - **Query Parameters:**
   *   - `userId` (optional): Target student ID (admin/dean only)
   * - **Responses:**
   *   - 200: Current schedule and conflict information
   *   - 403: Unauthorized access attempt
   *   - 404: No enrollments found
   *
   * ### GET /schedules/historical
   * Retrieves historical schedules for closed academic periods.
   * - **Roles:** STUDENT, ADMIN, DEAN
   * - **Query Parameters:**
   *   - `userId` (optional): Target student ID (admin/dean only)
   *   - `from` (optional): Start date filter
   *   - `to` (optional): End date filter
   * - **Responses:**
   *   - 200: Historical schedules
   *   - 400: Invalid period or period not closed
   *
   * ### GET /schedules/historical/:periodId
   * Retrieves a specific historical schedule for a closed period.
   * - **Roles:** STUDENT, ADMIN, DEAN
   * - **Query Parameters:**
   *   - `periodId`: Academic period identifier (required)
   *   - `userId` (optional): Target student ID (admin/dean only)
   * - **Responses:**
   *   - 200: Historical schedule for the period
   *   - 400: Period is not closed or does not exist
   *
   * ### GET /schedules/traffic-light
   * Retrieves the academic traffic light status for the student.
   * - **Roles:** STUDENT, ADMIN, DEAN
   * - **Query Parameters:**
   *   - `userId` (optional): Target student ID (admin/dean only)
   *   - `details` (optional): If 'true', includes detailed breakdown
   * - **Responses:**
   *   - 200: Academic traffic light status
   *
   * ## Security
   * All endpoints require JWT authentication and role-based authorization.
   *
   * ## Error Handling
   * Returns appropriate HTTP status codes and messages for unauthorized access,
   * not found resources, invalid periods, and internal server errors.
   *
   * ## Logging
   * Logs unauthorized access attempts and errors for audit and debugging purposes.
   */

  /**
   * Retrieves the current academic schedule for the authenticated student.
   * Allows ADMIN and DEAN to query schedules for other students via the userId parameter.
   *
   * @param req - The request object containing user authentication info.
   * @param queryUserId - (Optional) The ID of the student whose schedule is requested.
   * @returns The current schedule, conflict information, and metadata.
   * @throws ForbiddenException if unauthorized access is attempted.
   * @throws HttpException if the student is not found or an internal error occurs.
   */
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

  /**
   * Retrieves historical schedules for closed academic periods.
   * Allows ADMIN and DEAN to query historical schedules for other students via the userId parameter.
   *
   * @param req - The request object containing user authentication info.
   * @param queryUserId - (Optional) The ID of the student whose historical schedules are requested.
   * @param fromDate - (Optional) Start date filter for historical periods.
   * @param toDate - (Optional) End date filter for historical periods.
   * @param closed - (Optional) Filter for closed periods.
   * @returns Historical schedules and metadata.
   * @throws ForbiddenException if unauthorized access is attempted.
   * @throws HttpException if an invalid period is requested or an internal error occurs.
   */
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
    @Query('closed') closed?: string,
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

  // B1. US-0014: Validación de rango de fechas
  if ((error as Error).message.includes('From date must be before')) {
    throw new HttpException(
      (error as Error).message,
      HttpStatus.BAD_REQUEST,
    );
  }


  
  if ((error as Error).message.includes('Invalid') && 
      (error as Error).message.includes('date format')) {
    throw new HttpException(
      (error as Error).message,
      HttpStatus.BAD_REQUEST,
    );
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
    'Internal server error',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}


  }

  /**
   * Retrieves a specific historical schedule for a closed academic period.
   * Allows ADMIN and DEAN to query for other students via the userId parameter.
   *
   * @param req - The request object containing user authentication info.
   * @param periodId - The ID of the academic period.
   * @param queryUserId - (Optional) The ID of the student whose schedule is requested.
   * @returns The historical schedule for the specified period.
   * @throws ForbiddenException if unauthorized access is attempted.
   * @throws HttpException if the period is not closed, does not exist, or an internal error occurs.
   */
  @Get('historical/:periodId')
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
    @Param('periodId') periodId: string,
    @Query('userId') queryUserId?: string,
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
          `Unauthorized access attempt: User ${authenticatedUserId} tried to access ${queryUserId}'s historical schedule`,
        );
        throw new ForbiddenException(
          'You can only access your own historical schedules',
        );
      }
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

  /**
   * Retrieves the academic traffic light status for the student.
   * Allows ADMIN and DEAN to query for other students via the userId parameter.
   *
   * @param req - The request object containing user authentication info.
   * @param queryUserId - (Optional) The ID of the student whose status is requested.
   * @param includeDetails - (Optional) If 'true', includes a detailed breakdown.
   * @returns The academic traffic light status.
   * @throws ForbiddenException if unauthorized access is attempted.
   * @throws HttpException if an internal error occurs.
   */
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
