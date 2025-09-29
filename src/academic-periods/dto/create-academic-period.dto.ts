import { IsString, IsNotEmpty, IsDate, IsBoolean, IsOptional, Length, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Academic Period DTO
 *
 * Data Transfer Object for creating new academic periods in the system.
 * This DTO validates and structures the input data required to establish
 * a new academic period with all necessary configurations.
 *
 * ! IMPORTANTE: Los periodos académicos son fundamentales para la gestión
 * ! del sistema y deben ser creados con cuidado
 */
export class CreateAcademicPeriodDto {
  /**
   * Unique identification code for the academic period
   *
   * * Debe ser único en todo el sistema
   * ? Formato sugerido: YYYY-S (ej: 2024-1, 2024-2)
   */
  @ApiProperty({
    description: 'Unique identification code for the academic period',
    example: '2024-1',
    minLength: 3,
    maxLength: 20,
    pattern: '^[A-Za-z0-9-_]+$'
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Matches(/^[A-Za-z0-9-_]+$/, {
    message: 'Code must contain only letters, numbers, hyphens, and underscores'
  })
  code: string;

  /**
   * Descriptive name for the academic period
   *
   * * Nombre completo y descriptivo del periodo
   */
  @ApiProperty({
    description: 'Descriptive name for the academic period',
    example: 'First Semester 2024',
    minLength: 5,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  name: string;

  /**
   * Official start date of the academic period
   *
   * ! Debe ser anterior a la fecha de finalización
   */
  @ApiProperty({
    description: 'Official start date of the academic period',
    example: '2024-01-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  /**
   * Official end date of the academic period
   *
   * ! Debe ser posterior a la fecha de inicio
   */
  @ApiProperty({
    description: 'Official end date of the academic period',
    example: '2024-06-30T23:59:59.999Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  /**
   * Whether this period is currently active
   *
   * ? Solo un periodo puede estar activo a la vez
   * * Por defecto: false
   */
  @ApiProperty({
    description: 'Whether this period is currently active (only one can be active at a time)',
    example: false,
    default: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /**
   * Whether change requests are allowed during this period
   *
   * * Permite solicitudes de cambio de materias
   * * Por defecto: false
   */
  @ApiProperty({
    description: 'Whether change requests are allowed during this period',
    example: false,
    default: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  allowChangeRequests?: boolean;

  /**
   * Whether enrollment is currently open for this period
   *
   * * Controla si los estudiantes pueden matricularse
   * * Por defecto: true
   */
  @ApiProperty({
    description: 'Whether enrollment is currently open for this period',
    example: true,
    default: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isEnrollmentOpen?: boolean;

  /**
   * Optional description with additional details about the period
   *
   * ? Información adicional sobre el periodo académico
   */
  @ApiProperty({
    description: 'Optional description with additional details about the period',
    example: 'First academic semester of 2024 with extended enrollment period',
    maxLength: 500,
    required: false
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;
}