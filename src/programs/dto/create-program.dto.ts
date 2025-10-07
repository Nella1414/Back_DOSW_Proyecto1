import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
  Matches,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Program DTO
 *
 * Data Transfer Object for creating new academic programs in the institutional catalog.
 * This DTO validates and structures the input data required to establish
 * a new academic program with faculty association, curriculum requirements, and degree specifications.
 *
 * ! IMPORTANTE: Los programas académicos son la estructura curricular principal
 * ! y deben ser creados con validación exhaustiva de requisitos académicos
 */
export class CreateProgramDto {
  /**
   * Unique program identification code
   *
   * * Debe ser único en toda la institución
   * ? Formato sugerido: [AREA]-[TYPE] (ej: SYS-ENG, MED-DOC)
   */
  @ApiProperty({
    description: 'Unique program identification code',
    example: 'SYS-ENG',
    minLength: 5,
    maxLength: 20,
    pattern: '^[A-Z]{3,4}-[A-Z]{3,6}$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  @Matches(/^[A-Z]{3,4}-[A-Z]{3,6}$/, {
    message:
      'Program code must follow format: [3-4 LETTERS]-[3-6 LETTERS] (e.g., SYS-ENG, MED-DOC)',
  })
  code: string;

  /**
   * Complete program name
   *
   * * Nombre oficial completo del programa académico
   */
  @ApiProperty({
    description: 'Complete official program name',
    example: 'Systems Engineering',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  name: string;

  /**
   * Faculty ID association
   *
   * * ID de la facultad a la que pertenece el programa
   * ! Debe ser una facultad existente y activa
   */
  @ApiProperty({
    description: 'MongoDB ObjectId of the faculty this program belongs to',
    example: '674a1b2c3d4e5f6g7h8i9j0k',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  facultyId: string;

  /**
   * Total number of academic semesters
   *
   * * Número total de semestres del programa
   * ! Debe estar entre 8 y 12 semestres para programas de pregrado
   */
  @ApiProperty({
    description: 'Total number of academic semesters in the program',
    example: 10,
    minimum: 6,
    maximum: 16,
  })
  @IsNumber()
  @Min(6)
  @Max(16)
  totalSemesters: number;

  /**
   * Whether the program is currently active
   *
   * * Controla si el programa está disponible para nuevas matrículas
   * * Por defecto: true
   */
  @ApiProperty({
    description:
      'Whether the program is currently active and accepting new enrollments',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /**
   * Detailed program description
   *
   * ? Descripción detallada del programa, objetivos y perfil profesional
   */
  @ApiProperty({
    description:
      'Detailed description of the program, objectives, and professional profile',
    example:
      'Comprehensive systems engineering program focusing on software development, system analysis, and technology management',
    maxLength: 1000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  description?: string;

  /**
   * Degree type awarded
   *
   * * Tipo de título que otorga el programa
   */
  @ApiProperty({
    description: 'Type of degree awarded upon program completion',
    example: 'Bachelor of Systems Engineering',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  degree?: string;

  /**
   * Total academic credits required
   *
   * * Total de créditos académicos requeridos para graduarse
   * ? Típicamente entre 140-180 créditos para pregrado
   */
  @ApiProperty({
    description: 'Total academic credits required to complete the program',
    example: 160,
    minimum: 120,
    maximum: 220,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(120)
  @Max(220)
  totalCredits?: number;

  /**
   * Program duration in years
   *
   * ? Duración estimada del programa en años
   */
  @ApiProperty({
    description: 'Estimated program duration in years',
    example: 5,
    minimum: 3,
    maximum: 8,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(3)
  @Max(8)
  durationYears?: number;

  /**
   * Accreditation status
   *
   * ? Estado de acreditación del programa
   */
  @ApiProperty({
    description: 'Current accreditation status of the program',
    example: 'Accredited',
    enum: ['Accredited', 'In Process', 'Not Accredited', 'Pending'],
    required: false,
  })
  @IsString()
  @IsOptional()
  accreditationStatus?: string;
}
