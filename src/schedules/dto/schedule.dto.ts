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
    enum: ['green', 'yellow', 'red'],
  })
  @IsString()
  @IsIn(['green', 'yellow', 'red'])
  color: 'green' | 'yellow' | 'red';
}
