import { Injectable } from '@nestjs/common';
import { CreateAcademicTrafficLightDto } from '../dto/create-academic-traffic-light.dto';
import { UpdateAcademicTrafficLightDto } from '../dto/update-academic-traffic-light.dto';
import { AcademicTrafficLightService as SchedulesTrafficLightService } from '../../schedules/services/academic-traffic-light.service';
import { StudentAcademicStatusDto, AcademicStatisticsDto, StudentTrafficLightReportDto } from '../../schedules/dto/academic-traffic-light.dto';

/**
 * * Academic Traffic Light Controller Service
 *
 * This service acts as a controller-level service that delegates
 * the actual traffic light logic to the specialized service in schedules module.
 * Provides REST API endpoints for academic traffic light functionality.
 */
@Injectable()
export class AcademicTrafficLightService {
  constructor(
    private readonly schedulesTrafficLightService: SchedulesTrafficLightService,
  ) {}
  /**
   * Get comprehensive academic statistics for all students
   */
  async getAcademicStatistics(): Promise<AcademicStatisticsDto> {
    const stats = await this.schedulesTrafficLightService.getAcademicStatistics();

    return {
      ...stats,
      greenPercentage: stats.totalStudents > 0 ? Math.round((stats.greenStudents / stats.totalStudents) * 100) : 0,
      yellowPercentage: stats.totalStudents > 0 ? Math.round((stats.yellowStudents / stats.totalStudents) * 100) : 0,
      redPercentage: stats.totalStudents > 0 ? Math.round((stats.redStudents / stats.totalStudents) * 100) : 0,
    };
  }

  /**
   * Get academic status for a specific student
   */
  async getStudentAcademicStatus(studentId: string): Promise<StudentAcademicStatusDto> {
    return await this.schedulesTrafficLightService.getStudentAcademicStatus(studentId);
  }

  /**
   * Get complete traffic light report for a student
   */
  async getStudentTrafficLightReport(studentId: string): Promise<StudentTrafficLightReportDto> {
    const [studentInfo, courseStatuses] = await Promise.all([
      this.schedulesTrafficLightService.getStudentAcademicStatus(studentId),
      this.schedulesTrafficLightService.getStudentCourseStatuses(studentId)
    ]);

    return {
      studentInfo,
      courseStatuses
    };
  }

  /**
   * Legacy create method - now redirects to get student status
   */
  create(createAcademicTrafficLightDto: CreateAcademicTrafficLightDto) {
    return 'Use /students/{studentId}/academic-status endpoint to get student traffic light status';
  }

  /**
   * Get all academic traffic light data
   */
  async findAll() {
    return await this.getAcademicStatistics();
  }

  /**
   * Get specific student traffic light data
   */
  async findOne(studentId: string) {
    return await this.getStudentTrafficLightReport(studentId);
  }

  /**
   * Update is not applicable for automatically calculated traffic light status
   */
  update(id: number, updateAcademicTrafficLightDto: UpdateAcademicTrafficLightDto) {
    return 'Traffic light status is automatically calculated based on student performance';
  }

  /**
   * Remove is not applicable for automatically calculated traffic light status
   */
  remove(id: number) {
    return 'Traffic light status cannot be deleted as it is automatically calculated';
  }
}
