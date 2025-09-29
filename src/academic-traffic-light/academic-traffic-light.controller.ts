import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AcademicTrafficLightService } from './services/academic-traffic-light.service';

/**
 * Academic Traffic Light Controller
 *
 * Provides REST API endpoints for academic traffic light functionality.
 * The traffic light system evaluates student academic performance and provides
 * visual indicators (green/yellow/red) for academic status monitoring.
 */
@ApiTags('Academic Traffic Light')
@Controller('academic-traffic-light')
export class AcademicTrafficLightController {
  constructor(private readonly academicTrafficLightService: AcademicTrafficLightService) {}

  /**
   * Get comprehensive academic statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get academic statistics',
    description: 'Retrieves comprehensive statistics about student academic performance including traffic light distribution and average GPA'
  })
  @ApiResponse({
    status: 200,
    description: 'Academic statistics retrieved successfully'
  })
  getAcademicStatistics() {
    return this.academicTrafficLightService.getAcademicStatistics();
  }

  /**
   * Get student academic status by student ID
   */
  @Get('student/:studentId/status')
  @ApiOperation({
    summary: 'Get student academic status',
    description: 'Retrieves detailed academic status for a specific student including overall performance, GPA, and risk assessment'
  })
  @ApiParam({ name: 'studentId', description: 'Student identification code' })
  @ApiResponse({
    status: 200,
    description: 'Student academic status retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found'
  })
  getStudentAcademicStatus(@Param('studentId') studentId: string) {
    return this.academicTrafficLightService.getStudentAcademicStatus(studentId);
  }

  /**
   * Get complete traffic light report for a student
   */
  @Get('student/:studentId/report')
  @ApiOperation({
    summary: 'Get student traffic light report',
    description: 'Retrieves a comprehensive traffic light report including student status and detailed course performance breakdown'
  })
  @ApiParam({ name: 'studentId', description: 'Student identification code' })
  @ApiResponse({
    status: 200,
    description: 'Student traffic light report retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found'
  })
  getStudentTrafficLightReport(@Param('studentId') studentId: string) {
    return this.academicTrafficLightService.getStudentTrafficLightReport(studentId);
  }

  /**
   * Legacy endpoint - Get all academic statistics
   */
  @Get()
  @ApiOperation({
    summary: 'Get all traffic light data',
    description: 'Legacy endpoint that returns academic statistics. Use /statistics endpoint instead.'
  })
  @ApiResponse({
    status: 200,
    description: 'Academic statistics retrieved successfully'
  })
  findAll() {
    return this.academicTrafficLightService.findAll();
  }

  /**
   * Legacy endpoint - Get specific student data
   */
  @Get(':studentId')
  @ApiOperation({
    summary: 'Get student traffic light data',
    description: 'Legacy endpoint that returns student traffic light report. Use /student/{studentId}/report endpoint instead.'
  })
  @ApiParam({ name: 'studentId', description: 'Student identification code' })
  @ApiResponse({
    status: 200,
    description: 'Student traffic light data retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found'
  })
  findOne(@Param('studentId') studentId: string) {
    return this.academicTrafficLightService.findOne(studentId);
  }
}
