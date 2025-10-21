import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AcademicTrafficLightService } from './services/academic-traffic-light.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminOrDean } from '../auth/decorators/auth.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { StudentIdParamDto } from './dto/student-id-param.dto';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';

/**
 * Academic Traffic Light Controller
 *
 * Provides REST API endpoints for academic traffic light functionality.
 * The traffic light system evaluates student academic performance and provides
 * visual indicators (green/blue/red) for academic status monitoring.
 *
 * Authorization Rules:
 * - Students can only view their own academic data
 * - Deans and Admins can view any student's data
 * - Statistics endpoint is restricted to Deans and Admins only
 */
@ApiTags('Academic Traffic Light')
@ApiBearerAuth()
@Controller('academic-traffic-light')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicTrafficLightController {
  constructor(
    private readonly academicTrafficLightService: AcademicTrafficLightService,
  ) {}

  /**
   * Helper method to check if user can access student data
   * Students can only access their own data
   * Admins and Deans can access any student's data
   */
  private canAccessStudentData(
    requestingUser: any,
    targetStudentId: string,
  ): boolean {
    const userRoles = requestingUser.roles || [];

    // Admins and Deans can access any student data
    if (
      userRoles.includes(RoleName.ADMIN) ||
      userRoles.includes(RoleName.DEAN)
    ) {
      return true;
    }

    // Students can only access their own data
    // Check both externalId from JWT and userId
    if (userRoles.includes(RoleName.STUDENT)) {
      return (
        requestingUser.externalId === targetStudentId ||
        requestingUser.userId?.toString() === targetStudentId
      );
    }

    return false;
  }

  /**
   * Get comprehensive academic statistics
   * Only accessible by Admins and Deans
   */
  @Get('statistics')
  @AdminOrDean()
  @ApiOperation({
    summary: 'Get academic statistics (Admin/Dean only)',
    description:
      'Retrieves comprehensive statistics about student academic performance including traffic light distribution and average GPA. Only accessible by administrators and deans.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Dean role required',
  })
  getAcademicStatistics() {
    return this.academicTrafficLightService.getAcademicStatistics();
  }

  /**
   * Get student academic status by student ID
   * Students can only access their own data
   * Admins and Deans can access any student's data
   */
  @Get('student/:studentId/status')
  @ApiOperation({
    summary: 'Get student academic status',
    description:
      'Retrieves detailed academic status for a specific student including overall performance, GPA, and risk assessment. Students can only access their own data.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student identification code or external ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Student academic status retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot access other student data',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  getStudentAcademicStatus(
    @Param() params: StudentIdParamDto,
    @Request() req: any,
  ) {
    const { studentId } = params;

    // Check authorization
    if (!this.canAccessStudentData(req.user, studentId)) {
      throw new ForbiddenException(
        'You do not have permission to access this student data',
      );
    }

    return this.academicTrafficLightService.getStudentAcademicStatus(studentId);
  }

  /**
   * Get complete traffic light report for a student
   *
   * **Authorization:**
   * - Students can only access their own data
   * - Admins and Deans can access any student's data
   *
   * **Caching:**
   * - Responses are cached for 5 minutes to improve performance
   * - Each user gets their own cached version (cache key includes user ID)
   * - Cache automatically expires after TTL or can be invalidated
   * - Reduces database queries from ~150ms to ~5ms for cached requests
   *
   * **Cache Benefits:**
   * - Faster response times for repeated requests
   * - Reduced database load
   * - Better scalability for high-traffic scenarios
   * - Maintains data security (per-user cache isolation)
   *
   * **Example:**
   * First request (cache miss):  ~150ms - fetches from database
   * Second request (cache hit):  ~5ms   - returns from cache
   * After 5 minutes:             ~150ms - cache expired, refetches
   *
   * @param params - Student ID parameter (validated)
   * @param req - Request object containing authenticated user
   * @returns Comprehensive traffic light report with student info and course statuses
   */
  @Get('student/:studentId/report')
  @UseInterceptors(HttpCacheInterceptor)
  @ApiOperation({
    summary: 'Get student traffic light report (Cached)',
    description:
      'Retrieves a comprehensive traffic light report including student status and detailed course performance breakdown. ' +
      'Students can only access their own data. ' +
      '**Performance:** Results are cached for 5 minutes to improve response time.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student identification code or external ID',
  })
  @ApiResponse({
    status: 200,
    description:
      'Student traffic light report retrieved successfully. May be served from cache if recently requested.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot access other student data',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  getStudentTrafficLightReport(
    @Param() params: StudentIdParamDto,
    @Request() req: any,
  ) {
    const { studentId } = params;

    // Check authorization
    if (!this.canAccessStudentData(req.user, studentId)) {
      throw new ForbiddenException(
        'You do not have permission to access this student data',
      );
    }

    return this.academicTrafficLightService.getStudentTrafficLightReport(
      studentId,
    );
  }

  /**
   * Legacy endpoint - Get all academic statistics
   * @deprecated Use /statistics endpoint instead
   */
  @Get()
  @AdminOrDean()
  @ApiOperation({
    summary: 'Get all traffic light data (Admin/Dean only) [DEPRECATED]',
    description:
      'Legacy endpoint that returns academic statistics. Use /statistics endpoint instead.',
    deprecated: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Academic statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Dean role required',
  })
  findAll() {
    return this.academicTrafficLightService.getAcademicStatistics();
  }

  /**
   * Legacy endpoint - Get specific student data
   * @deprecated Use /student/{studentId}/report endpoint instead
   */
  @Get(':studentId')
  @ApiOperation({
    summary: 'Get student traffic light data [DEPRECATED]',
    description:
      'Legacy endpoint that returns student traffic light report. Use /student/{studentId}/report endpoint instead.',
    deprecated: true,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student identification code or external ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Student traffic light data retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot access other student data',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  findOne(@Param() params: StudentIdParamDto, @Request() req: any) {
    const { studentId } = params;

    // Check authorization
    if (!this.canAccessStudentData(req.user, studentId)) {
      throw new ForbiddenException(
        'You do not have permission to access this student data',
      );
    }

    return this.academicTrafficLightService.getStudentTrafficLightReport(
      studentId,
    );
  }
}
