import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Query Courses DTO
 *
 * Comprehensive query parameters for filtering and searching courses
 * in the academic catalog. Extends base search and sort functionality
 * with course-specific filters.
 *
 * ! IMPORTANTE: Parámetros específicos para consultas de cursos
 * * Permite filtrado avanzado por créditos, nivel, prerequisitos, etc.
 */
export class QueryCoursesDto {
  /**
   * Filter by active status
   *
   * * Filtrar por estado activo/inactivo
   */
  @ApiProperty({
    description: 'Filter by active status (true for active courses only)',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  /**
   * Minimum credit hours filter
   *
   * * Filtro por número mínimo de créditos
   */
  @ApiProperty({
    description: 'Filter courses with minimum number of credits',
    example: 2,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  minCredits?: number;

  /**
   * Maximum credit hours filter
   *
   * * Filtro por número máximo de créditos
   */
  @ApiProperty({
    description: 'Filter courses with maximum number of credits',
    example: 4,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  maxCredits?: number;

  /**
   * Academic level filter
   *
   * ? Filtro por nivel académico del curso
   */
  @ApiProperty({
    description:
      'Filter by academic level (1-4 for undergraduate, 5+ for graduate)',
    example: 1,
    minimum: 1,
    maximum: 8,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(8)
  academicLevel?: number;

  /**
   * Course category filter
   *
   * ? Filtro por categoría del curso
   */
  @ApiProperty({
    description: 'Filter by course category',
    example: 'Core',
    enum: ['Core', 'Elective', 'Laboratory', 'Seminar', 'Workshop', 'Thesis'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['Core', 'Elective', 'Laboratory', 'Seminar', 'Workshop', 'Thesis'])
  category?: string;

  /**
   * Include courses with prerequisites only
   *
   * ? Incluir solo cursos que tienen prerrequisitos
   */
  @ApiProperty({
    description: 'Filter to include only courses that have prerequisites',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasPrerequisites?: boolean;

  /**
   * Course code prefix filter
   *
   * * Filtrar por prefijo del código del curso (ej: CS, MATH)
   */
  @ApiProperty({
    description: 'Filter by course code prefix (e.g., CS, MATH, ENG)',
    example: 'CS',
    maxLength: 10,
    required: false,
  })
  @IsOptional()
  @IsString()
  codePrefix?: string;

  /**
   * Sort field options for courses
   *
   * * Campo de ordenamiento específico para cursos
   */
  @ApiProperty({
    description: 'Field to sort courses by',
    example: 'code',
    enum: [
      'code',
      'name',
      'credits',
      'academicLevel',
      'createdAt',
      'updatedAt',
    ],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['code', 'name', 'credits', 'academicLevel', 'createdAt', 'updatedAt'])
  declare sortBy?: string;
}
