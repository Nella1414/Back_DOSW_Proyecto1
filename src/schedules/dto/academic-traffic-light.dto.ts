import { ApiProperty } from '@nestjs/swagger';
import type { TrafficLightColor } from '../services/academic-traffic-light.service';

/**
 * Student Academic Status DTO
 *
 * Comprehensive data transfer object that represents a student's
 * complete academic status including performance metrics, risk assessment,
 * and personalized recommendations.
 *
 * ! IMPORTANTE: Este DTO contiene información sensible del rendimiento académico
 * * Usado principalmente para el sistema de semáforo académico
 */
export class StudentAcademicStatusDto {
  /**
   * Unique student identification code
   * * Código único del estudiante en el sistema
   */
  @ApiProperty({
    description: 'Unique student identification code',
    example: 'CS2024001'
  })
  studentId: string;

  /**
   * Complete student name for display
   * * Nombre completo del estudiante
   */
  @ApiProperty({
    description: 'Complete student name for display',
    example: 'Maria Rodriguez'
  })
  studentName: string;

  /**
   * Current academic semester
   * * Semestre académico actual del estudiante
   */
  @ApiProperty({
    description: 'Current academic semester',
    example: 3,
    minimum: 1,
    maximum: 12
  })
  currentSemester: number;

  /**
   * Overall traffic light color indicating academic performance
   * ! Color principal del semáforo académico
   */
  @ApiProperty({
    description: 'Overall traffic light color indicating academic performance',
    example: 'green',
    enum: ['green', 'yellow', 'red']
  })
  overallColor: TrafficLightColor;

  /**
   * Total academic credits successfully passed
   * * Créditos académicos aprobados
   */
  @ApiProperty({
    description: 'Total academic credits successfully passed',
    example: 45,
    minimum: 0
  })
  passedCredits: number;

  /**
   * Total academic credits attempted
   * * Total de créditos cursados (aprobados + reprobados)
   */
  @ApiProperty({
    description: 'Total academic credits attempted',
    example: 48,
    minimum: 0
  })
  totalCredits: number;

  /**
   * Grade Point Average (GPA)
   * * Promedio ponderado acumulado
   */
  @ApiProperty({
    description: 'Grade Point Average (GPA)',
    example: 3.75,
    minimum: 0,
    maximum: 5
  })
  gpa: number;

  /**
   * Academic risk level assessment
   * ! Nivel de riesgo académico del estudiante
   */
  @ApiProperty({
    description: 'Academic risk level assessment',
    example: 'low',
    enum: ['low', 'medium', 'high']
  })
  riskLevel: 'low' | 'medium' | 'high';

  /**
   * Personalized academic recommendations
   * ? Recomendaciones personalizadas para el estudiante
   */
  @ApiProperty({
    description: 'Personalized academic recommendations',
    example: ['Continue excellent academic performance', 'Consider advanced courses'],
    type: [String]
  })
  recommendations: string[];
}

/**
 * Course Status DTO
 *
 * Represents the academic status of a specific course for a student,
 * including enrollment status, grades, and traffic light indicators.
 *
 * * Usado para mostrar el estado de cada materia individual
 */
export class CourseStatusDto {
  /**
   * Course identification code
   * * Código único del curso
   */
  @ApiProperty({
    description: 'Course identification code',
    example: 'CS101'
  })
  courseCode: string;

  /**
   * Full course name
   * * Nombre completo del curso
   */
  @ApiProperty({
    description: 'Full course name',
    example: 'Introduction to Computer Science'
  })
  courseName: string;

  /**
   * Number of academic credits for this course
   * * Número de créditos académicos
   */
  @ApiProperty({
    description: 'Number of academic credits for this course',
    example: 3,
    minimum: 1,
    maximum: 10
  })
  credits: number;

  /**
   * Student's grade in this course (if available)
   * ? Calificación obtenida (si está disponible)
   */
  @ApiProperty({
    description: "Student's grade in this course (if available)",
    example: 4.2,
    minimum: 0,
    maximum: 5,
    required: false
  })
  grade?: number;

  /**
   * Current enrollment status
   * * Estado actual de la matrícula
   */
  @ApiProperty({
    description: 'Current enrollment status',
    example: 'PASSED',
    enum: ['ENROLLED', 'PASSED', 'FAILED']
  })
  status: string;

  /**
   * Traffic light color for this course
   * ! Color del semáforo para esta materia específica
   */
  @ApiProperty({
    description: 'Traffic light color for this course',
    example: 'green',
    enum: ['green', 'yellow', 'red']
  })
  color: TrafficLightColor;

  /**
   * Academic period code when course was taken
   * * Código del periodo académico
   */
  @ApiProperty({
    description: 'Academic period code when course was taken',
    example: '2024-1'
  })
  periodCode: string;
}

/**
 * Academic Statistics DTO
 *
 * Aggregated statistics for the academic traffic light system,
 * providing insights into overall student performance distribution.
 *
 * * Estadísticas generales del sistema de semáforo académico
 */
export class AcademicStatisticsDto {
  /**
   * Total number of students in the system
   * * Total de estudiantes en el sistema
   */
  @ApiProperty({
    description: 'Total number of students in the system',
    example: 1250,
    minimum: 0
  })
  totalStudents: number;

  /**
   * Number of students with green status (good performance)
   * * Estudiantes con estado verde (buen rendimiento)
   */
  @ApiProperty({
    description: 'Number of students with green status (good performance)',
    example: 875,
    minimum: 0
  })
  greenStudents: number;

  /**
   * Number of students with yellow status (attention needed)
   * ? Estudiantes con estado amarillo (requieren atención)
   */
  @ApiProperty({
    description: 'Number of students with yellow status (attention needed)',
    example: 250,
    minimum: 0
  })
  yellowStudents: number;

  /**
   * Number of students with red status (intervention required)
   * ! Estudiantes con estado rojo (requieren intervención)
   */
  @ApiProperty({
    description: 'Number of students with red status (intervention required)',
    example: 125,
    minimum: 0
  })
  redStudents: number;

  /**
   * Overall average GPA across all students
   * * Promedio general de todos los estudiantes
   */
  @ApiProperty({
    description: 'Overall average GPA across all students',
    example: 3.45,
    minimum: 0,
    maximum: 5
  })
  averageGPA: number;

  /**
   * Percentage of students with green status
   * * Porcentaje de estudiantes en verde
   */
  @ApiProperty({
    description: 'Percentage of students with green status',
    example: 70,
    minimum: 0,
    maximum: 100
  })
  greenPercentage: number;

  /**
   * Percentage of students with yellow status
   * ? Porcentaje de estudiantes en amarillo
   */
  @ApiProperty({
    description: 'Percentage of students with yellow status',
    example: 20,
    minimum: 0,
    maximum: 100
  })
  yellowPercentage: number;

  /**
   * Percentage of students with red status
   * ! Porcentaje de estudiantes en rojo
   */
  @ApiProperty({
    description: 'Percentage of students with red status',
    example: 10,
    minimum: 0,
    maximum: 100
  })
  redPercentage: number;
}

/**
 * Student Traffic Light Report DTO
 *
 * Comprehensive academic report combining student status information
 * with detailed course-by-course performance breakdown.
 *
 * ! IMPORTANTE: Reporte completo del estado académico del estudiante
 * * Incluye información general y detalle por materias
 */
export class StudentTrafficLightReportDto {
  /**
   * General student academic status and metrics
   * * Información general del estado académico
   */
  @ApiProperty({
    description: 'General student academic status and metrics',
    type: StudentAcademicStatusDto
  })
  studentInfo: StudentAcademicStatusDto;

  /**
   * Detailed course statuses organized by enrollment status
   * * Estados detallados de las materias organizados por estado
   */
  @ApiProperty({
    description: 'Detailed course statuses organized by enrollment status',
    type: 'object',
    properties: {
      passedCourses: {
        type: 'array',
        items: { $ref: '#/components/schemas/CourseStatusDto' }
      },
      currentCourses: {
        type: 'array',
        items: { $ref: '#/components/schemas/CourseStatusDto' }
      },
      failedCourses: {
        type: 'array',
        items: { $ref: '#/components/schemas/CourseStatusDto' }
      }
    }
  })
  courseStatuses: {
    passedCourses: CourseStatusDto[];
    currentCourses: CourseStatusDto[];
    failedCourses: CourseStatusDto[];
  };
}