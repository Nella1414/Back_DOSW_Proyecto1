import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsMongoId,
  Min,
  Max,
  Length,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { EnrollmentStatus } from '../entities/enrollment.entity';

/**
 * Create Enrollment DTO
 *
 * Data Transfer Object for creating new student enrollments.
 * Validates and structures the input data required to register a student in a course group for a specific academic period.
 */
export class CreateEnrollmentDto {
  /**
   * Student ID
   *
   * MongoDB ObjectId of the student being enrolled.
   *
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: 'ID del estudiante (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'El ID del estudiante es obligatorio' })
  @IsMongoId({ message: 'El ID del estudiante debe ser un ObjectId válido' })
  studentId: string;

  /**
   * Course group ID
   *
   * MongoDB ObjectId of the group to enroll in.
   *
   * @example "507f1f77bcf86cd799439012"
   */
  @ApiProperty({
    description: 'ID del grupo de curso (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsNotEmpty({ message: 'El ID del grupo es obligatorio' })
  @IsMongoId({ message: 'El ID del grupo debe ser un ObjectId válido' })
  groupId: string;

  /**
   * Academic period ID
   *
   * MongoDB ObjectId of the academic period.
   *
   * @example "507f1f77bcf86cd799439013"
   */
  @ApiProperty({
    description: 'ID del periodo académico (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439013',
  })
  @IsNotEmpty({ message: 'El ID del periodo académico es obligatorio' })
  @IsMongoId({ message: 'El ID del periodo debe ser un ObjectId válido' })
  academicPeriodId: string;

  /**
   * Enrollment status
   *
   * Default: ENROLLED
   *
   * @example "enrolled"
   */
  @ApiProperty({
    description: 'Estado de la inscripción',
    example: EnrollmentStatus.ENROLLED,
    enum: EnrollmentStatus,
    required: false,
    default: EnrollmentStatus.ENROLLED,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus, { 
    message: 'Estado inválido. Valores permitidos: enrolled, cancelled, passed, failed, withdrawn' 
  })
  status?: EnrollmentStatus;

  /**
   * Final grade for the course
   *
   * Range: 0.0 - 5.0
   * Only applies for PASSED or FAILED status.
   *
   * @example 4.5
   */
  @ApiProperty({
    description: 'Calificación final del curso (0.0 - 5.0)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La calificación debe ser un número' })
  @Min(0, { message: 'La calificación mínima es 0.0' })
  @Max(5, { message: 'La calificación máxima es 5.0' })
  grade?: number;

  /**
   * Attempt number
   *
   * Indicates how many times the student has taken this course.
   *
   * @example 1
   */
  @ApiProperty({
    description: 'Número de intento del estudiante en este curso',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'El número de intento debe ser un entero' })
  @Min(1, { message: 'El número de intento mínimo es 1' })
  attemptNumber?: number;

  /**
   * Special enrollment
   *
   * Indicates if this is an exceptional enrollment that required special approval.
   *
   * @example false
   */
  @ApiProperty({
    description: 'Indica si es una inscripción especial/excepcional',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo de inscripción especial debe ser booleano' })
  isSpecialEnrollment?: boolean;

  /**
   * Cancellation reason
   *
   * Required only if status is CANCELLED or WITHDRAWN.
   *
   * @example "Student health issues"
   */
  @ApiProperty({
    description: 'Motivo de cancelación (solo si status es cancelled o withdrawn)',
    example: 'Problemas de salud del estudiante',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @Length(10, 500, { 
    message: 'El motivo debe tener entre 10 y 500 caracteres' 
  })
  @Transform(({ value }) => value?.trim())
  cancellationReason?: string;

  /**
   * Additional notes
   *
   * Extra information about the enrollment.
   *
   * @example "Student with sports scholarship"
   */
  @ApiProperty({
    description: 'Notas adicionales sobre la inscripción',
    example: 'Estudiante con necesidades especiales',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @Length(0, 1000, { 
    message: 'Las notas no pueden exceder 1000 caracteres' 
  })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}