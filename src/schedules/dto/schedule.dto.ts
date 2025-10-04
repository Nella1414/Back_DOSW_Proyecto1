import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  Length,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Class Schedule DTO
 *
 * Individual class schedule information including course details,
 * time slot, location, and instructor information.
 *
 * * Información de horario de una clase individual
 */
export class ClassScheduleDto {
  /**
   * Course MongoDB ID
   *
   * ? ID de MongoDB del curso
   */
  @ApiProperty({
    description: 'Course MongoDB ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  courseId?: string;

  /**
   * Course identification code
   *
   * * Código del curso
   */
  @ApiProperty({
    description: 'Course identification code',
    example: 'CS101',
  })
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  /**
   * Complete course name
   *
   * * Nombre completo del curso
   */
  @ApiProperty({
    description: 'Complete course name',
    example: 'Introduction to Computer Science',
  })
  @IsString()
  @IsNotEmpty()
  courseName: string;

  /**
   * Group MongoDB ID
   *
   * ? ID de MongoDB del grupo
   */
  @ApiProperty({
    description: 'Group MongoDB ID',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsString()
  @IsOptional()
  groupId?: string;

  /**
   * Course group identifier
   *
   * * Identificador del grupo del curso
   */
  @ApiProperty({
    description: 'Course group identifier',
    example: 'A',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 5)
  groupNumber: string;

  /**
   * Class start time (24-hour format)
   *
   * * Hora de inicio de la clase (formato 24 horas)
   */
  @ApiProperty({
    description: 'Class start time in 24-hour format',
    example: '08:00',
    pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  /**
   * Class end time (24-hour format)
   *
   * * Hora de finalización de la clase (formato 24 horas)
   */
  @ApiProperty({
    description: 'Class end time in 24-hour format',
    example: '10:00',
    pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  /**
   * Classroom or location
   *
   * ? Aula o ubicación de la clase
   */
  @ApiProperty({
    description: 'Classroom or location where the class takes place',
    example: 'Aula 201',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  room?: string;

  /**
   * Professor or instructor name
   *
   * ? Nombre del profesor o instructor
   */
  @ApiProperty({
    description: 'Professor or instructor name',
    example: 'Dr. John Smith',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  professorName?: string;
}

/**
 * Daily Schedule DTO
 *
 * Schedule information for a specific day of the week including
 * all classes and their time slots.
 *
 * * Horario para un día específico de la semana
 */
export class DailyScheduleDto {
  /**
   * Day of week number (1-7, Monday-Sunday)
   *
   * * Número del día de la semana (1-7, Lunes-Domingo)
   */
  @ApiProperty({
    description: 'Day of week number (1=Monday, 7=Sunday)',
    example: 1,
    minimum: 1,
    maximum: 7,
  })
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  /**
   * Day name in Spanish
   *
   * * Nombre del día en español
   */
  @ApiProperty({
    description: 'Day name in Spanish',
    example: 'Lunes',
    enum: [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ],
  })
  @IsString()
  @IsIn([
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ])
  dayName: string;

  /**
   * Classes scheduled for this day
   *
   * * Clases programadas para este día
   */
  @ApiProperty({
    description: 'Classes scheduled for this day',
    type: [ClassScheduleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassScheduleDto)
  classes: ClassScheduleDto[];
}

/**
 * Student Schedule DTO
 *
 * Complete schedule information for a student including daily class distribution
 * and comprehensive schedule details for a specific academic period.
 *
 * ! IMPORTANTE: Horario completo del estudiante por periodo académico
 * * Incluye distribución diaria de clases y detalles completos
 */
export class StudentScheduleDto {
  /**
   * Student MongoDB ID
   *
   * ? ID de MongoDB del estudiante
   */
  @ApiProperty({
    description: 'Student MongoDB ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  _id?: string;

  /**
   * Student identification code
   *
   * * Código único del estudiante
   */
  @ApiProperty({
    description: 'Student identification code',
    example: 'CS2024001',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  /**
   * Complete student name
   *
   * * Nombre completo del estudiante
   */
  @ApiProperty({
    description: 'Complete student name',
    example: 'Maria Rodriguez',
  })
  @IsString()
  @IsNotEmpty()
  studentName: string;

  /**
   * Current academic semester
   *
   * * Semestre académico actual del estudiante
   */
  @ApiProperty({
    description: 'Current academic semester',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  currentSemester: number;

  /**
   * Academic period MongoDB ID
   *
   * ? ID de MongoDB del periodo académico
   */
  @ApiProperty({
    description: 'Academic period MongoDB ID',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsString()
  @IsOptional()
  periodId?: string;

  /**
   * Academic period code
   *
   * * Código del periodo académico
   */
  @ApiProperty({
    description: 'Academic period code',
    example: '2024-1',
  })
  @IsString()
  @IsNotEmpty()
  period: string;

  /**
   * Daily schedule breakdown
   *
   * * Distribución diaria del horario
   */
  @ApiProperty({
    description: 'Daily schedule breakdown for each day of the week',
    type: [DailyScheduleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyScheduleDto)
  schedule: DailyScheduleDto[];
}

/**
 * Academic History DTO
 *
 * Complete academic history for a student including passed, current,
 * and failed courses with detailed performance information.
 *
 * ! IMPORTANTE: Historial académico completo del estudiante
 * * Incluye cursos aprobados, actuales y reprobados
 */
export class AcademicHistoryDto {
  /**
   * Student identification code
   *
   * * Código único del estudiante
   */
  @ApiProperty({
    description: 'Student identification code',
    example: 'CS2024001',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  /**
   * Current academic semester
   *
   * * Semestre académico actual
   */
  @ApiProperty({
    description: 'Current academic semester',
    example: 5,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  currentSemester: number;

  /**
   * Organized academic history
   *
   * * Historial académico organizado por estado
   */
  @ApiProperty({
    description: 'Academic history organized by course status',
    type: 'object',
    properties: {
      passedCourses: {
        type: 'array',
        items: { $ref: '#/components/schemas/CourseHistoryDto' },
      },
      currentCourses: {
        type: 'array',
        items: { $ref: '#/components/schemas/CourseHistoryDto' },
      },
      failedCourses: {
        type: 'array',
        items: { $ref: '#/components/schemas/CourseHistoryDto' },
      },
    },
  })
  academicHistory: {
    passedCourses: CourseHistoryDto[];
    currentCourses: CourseHistoryDto[];
    failedCourses: CourseHistoryDto[];
  };
}

/**
 * Course History DTO
 *
 * Individual course record in student's academic history including
 * grades, status, and traffic light indicators.
 *
 * * Registro individual de curso en el historial académico
 */
export class CourseHistoryDto {
  /**
   * Academic period code
   *
   * * Código del periodo académico
   */
  @ApiProperty({
    description: 'Academic period code when course was taken',
    example: '2024-1',
  })
  @IsString()
  @IsNotEmpty()
  periodCode: string;

  /**
   * Course identification code
   *
   * * Código del curso
   */
  @ApiProperty({
    description: 'Course identification code',
    example: 'CS101',
  })
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  /**
   * Complete course name
   *
   * * Nombre completo del curso
   */
  @ApiProperty({
    description: 'Complete course name',
    example: 'Introduction to Computer Science',
  })
  @IsString()
  @IsNotEmpty()
  courseName: string;

  /**
   * Course credit hours
   *
   * * Número de créditos del curso
   */
  @ApiProperty({
    description: 'Course credit hours',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  credits: number;

  /**
   * Final grade obtained
   *
   * ? Calificación final obtenida
   */
  @ApiProperty({
    description: 'Final grade obtained (0.0 - 5.0 scale)',
    example: 4.2,
    minimum: 0,
    maximum: 5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  grade?: number;

  /**
   * Course enrollment status
   *
   * * Estado de la matrícula del curso
   */
  @ApiProperty({
    description: 'Course enrollment status',
    example: 'PASSED',
    enum: ['ENROLLED', 'PASSED', 'FAILED'],
  })
  @IsString()
  @IsIn(['ENROLLED', 'PASSED', 'FAILED'])
  status: string;

  /**
   * Traffic light color indicator
   *
   * ! Color del semáforo académico para este curso
   */
  @ApiProperty({
    description: 'Traffic light color indicator for academic performance',
    example: 'green',
    enum: ['green', 'blue', 'red'],
  })
  @IsString()
  @IsIn(['green', 'blue', 'red'])
  color: 'green' | 'blue' | 'red';
}

/**
 * Academic Period Info DTO
 *
 * Information about an academic period including dates and status.
 *
 * * Información sobre un periodo académico
 */
export class AcademicPeriodInfoDto {
  /**
   * Period code
   *
   * * Código del periodo
   */
  @ApiProperty({
    description: 'Period code',
    example: '2024-1',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  /**
   * Period name
   *
   * * Nombre del periodo
   */
  @ApiProperty({
    description: 'Period name',
    example: 'Primer Semestre 2024',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Period ID
   *
   * ? ID del periodo
   */
  @ApiProperty({
    description: 'Period ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  id?: string;

  /**
   * Period start date
   *
   * ? Fecha de inicio del periodo
   */
  @ApiProperty({
    description: 'Period start date',
    example: '2024-01-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  startDate?: Date;

  /**
   * Period end date
   *
   * ? Fecha de finalización del periodo
   */
  @ApiProperty({
    description: 'Period end date',
    example: '2024-06-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  endDate?: Date;

  /**
   * Period status
   *
   * ? Estado del periodo
   */
  @ApiProperty({
    description: 'Period status',
    example: 'CLOSED',
    enum: ['ACTIVE', 'CLOSED', 'UPCOMING'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'CLOSED', 'UPCOMING'])
  status?: string;
}

/**
 * Historical Schedule Period DTO
 *
 * Historical period information with academic summary.
 *
 * * Información de periodo histórico con resumen académico
 */
export class HistoricalSchedulePeriodDto {
  @ApiProperty({
    description: 'Period MongoDB ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  periodId?: string;

  @ApiProperty({
    description: 'Period code',
    example: '2024-1',
  })
  @IsString()
  @IsNotEmpty()
  periodCode: string;

  @ApiProperty({
    description: 'Period name',
    example: 'Primer Semestre 2024',
  })
  @IsString()
  @IsNotEmpty()
  periodName: string;

  @ApiProperty({
    description: 'Period start date',
    example: '2024-01-15T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Period end date',
    example: '2024-06-15T00:00:00.000Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Period status',
    example: 'CLOSED',
    enum: ['ACTIVE', 'CLOSED', 'UPCOMING'],
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Number of courses enrolled',
    example: 6,
  })
  @IsNumber()
  coursesEnrolled: number;

  @ApiProperty({
    description: 'Number of courses passed',
    example: 5,
  })
  @IsNumber()
  coursesPassed: number;

  @ApiProperty({
    description: 'Number of courses failed',
    example: 1,
  })
  @IsNumber()
  coursesFailed: number;

  @ApiProperty({
    description: 'Semester GPA',
    example: 4.2,
  })
  @IsNumber()
  semesterGPA: number;
}

/**
 * Historical Schedules Response DTO
 *
 * Response with historical schedules for a student.
 *
 * * Respuesta con horarios históricos del estudiante
 */
export class HistoricalSchedulesResponseDto {
  @ApiProperty({
    description: 'Student ID',
    example: 'CS2024001',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Student name',
    example: 'Maria Rodriguez',
    required: false,
  })
  @IsString()
  @IsOptional()
  studentName?: string;

  @ApiProperty({
    description: 'Current semester',
    example: 5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  currentSemester?: number;

  @ApiProperty({
    description: 'Historical periods',
    type: [HistoricalSchedulePeriodDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoricalSchedulePeriodDto)
  periods: HistoricalSchedulePeriodDto[];
}

/**
 * Course With Results DTO
 *
 * Course information including final grades and status.
 *
 * * Información de curso con resultados finales
 */
export class CourseWithResultsDto {
  @ApiProperty({
    description: 'Course MongoDB ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Course code',
    example: 'CS101',
  })
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @ApiProperty({
    description: 'Course name',
    example: 'Introduction to Computer Science',
  })
  @IsString()
  @IsNotEmpty()
  courseName: string;

  @ApiProperty({
    description: 'Course credits',
    example: 3,
  })
  @IsNumber()
  credits: number;

  @ApiProperty({
    description: 'Group MongoDB ID',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiProperty({
    description: 'Group number',
    example: 1,
  })
  @IsNumber()
  groupNumber: number;

  @ApiProperty({
    description: 'Final grade',
    example: 4.2,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  finalGrade?: number;

  @ApiProperty({
    description: 'Course status',
    example: 'PASSED',
    enum: ['ENROLLED', 'PASSED', 'FAILED'],
  })
  @IsString()
  @IsIn(['ENROLLED', 'PASSED', 'FAILED'])
  status: string;
}

/**
 * Historical Schedule By Period Response DTO
 *
 * Detailed historical schedule for a specific period.
 *
 * * Horario histórico detallado para un periodo específico
 */
export class HistoricalScheduleByPeriodResponseDto {
  @ApiProperty({
    description: 'Student ID',
    example: 'CS2024001',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Student name',
    example: 'Maria Rodriguez',
  })
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @ApiProperty({
    description: 'Period information',
    type: AcademicPeriodInfoDto,
  })
  @ValidateNested()
  @Type(() => AcademicPeriodInfoDto)
  period: AcademicPeriodInfoDto;

  @ApiProperty({
    description: 'Daily schedule',
    type: [DailyScheduleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyScheduleDto)
  schedule: DailyScheduleDto[];

  @ApiProperty({
    description: 'Courses with results',
    type: [CourseWithResultsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseWithResultsDto)
  courses: CourseWithResultsDto[];
}
