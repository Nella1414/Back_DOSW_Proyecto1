import { Injectable } from '@nestjs/common';
import { AcademicTrafficLightService as SchedulesTrafficLightService } from '../../schedules/services/academic-traffic-light.service';
import {
  StudentAcademicStatusDto,
  AcademicStatisticsDto,
  StudentTrafficLightReportDto,
} from '../../schedules/dto/academic-traffic-light.dto';

/**
 * Academic Traffic Light Controller Service
 *
 * This service acts as a controller-level facade that delegates
 * the actual traffic light logic to the specialized service in schedules module.
 * Provides REST API endpoints for academic traffic light functionality.
 *
 * ! IMPORTANTE: Este servicio es una fachada que delega la lógica real
 * ! al servicio especializado en el módulo de horarios
 */
@Injectable()
export class AcademicTrafficLightService {
  constructor(
    // TODO: Inyectar el servicio de semáforo académico del módulo de horarios
    private readonly schedulesTrafficLightService: SchedulesTrafficLightService,
  ) {}
  /**
   * Get comprehensive academic statistics for all students
   */
  async getAcademicStatistics(): Promise<AcademicStatisticsDto> {
    const stats =
      await this.schedulesTrafficLightService.getAcademicStatistics();

    return {
      ...stats,
      greenPercentage:
        stats.totalStudents > 0
          ? Math.round((stats.greenStudents / stats.totalStudents) * 100)
          : 0,
      yellowPercentage:
        stats.totalStudents > 0
          ? Math.round((stats.yellowStudents / stats.totalStudents) * 100)
          : 0,
      redPercentage:
        stats.totalStudents > 0
          ? Math.round((stats.redStudents / stats.totalStudents) * 100)
          : 0,
    };
  }

  /**
   * Get academic status for a specific student
   */
  async getStudentAcademicStatus(
    studentId: string,
  ): Promise<StudentAcademicStatusDto> {
    return await this.schedulesTrafficLightService.getStudentAcademicStatus(
      studentId,
    );
  }

  /**
   * Get complete traffic light report for a student
   */
  async getStudentTrafficLightReport(
    studentId: string,
  ): Promise<StudentTrafficLightReportDto> {
    const [studentInfo, courseStatuses] = await Promise.all([
      this.schedulesTrafficLightService.getStudentAcademicStatus(studentId),
      this.schedulesTrafficLightService.getStudentCourseStatuses(studentId),
    ]);

    return {
      studentInfo,
      courseStatuses,
    };
  }

  /**
   * Legacy create method - now redirects to get student status
   *
   * ! DEPRECADO: El sistema de semáforo se calcula automáticamente
   */
  create() {
    return {
      message:
        'Traffic light status is automatically calculated based on student performance',
      recommendation:
        'Use /academic-traffic-light/student/{studentId}/status endpoint to get student traffic light status',
    };
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
   *
   * ! DEPRECADO: El sistema de semáforo se calcula automáticamente
   */
  update(id: number) {
    return {
      message:
        'Traffic light status is automatically calculated based on student performance',
      recommendation:
        'Academic status updates when student enrollments and grades change',
    };
  }

  /**
   * Remove is not applicable for automatically calculated traffic light status
   *
   * ! DEPRECADO: El sistema de semáforo se calcula automáticamente
   */
  remove(id: number) {
    return {
      message:
        'Traffic light status cannot be deleted as it is automatically calculated',
      recommendation:
        'Academic status is dynamically calculated based on student performance data',
    };
  }
}
