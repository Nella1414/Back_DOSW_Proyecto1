import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination Query DTO
 *
 * Standard pagination parameters for API endpoints that return lists of data.
 * Provides consistent pagination functionality across all modules in the system.
 *
 * ! IMPORTANTE: Usar estos parámetros en todos los endpoints de listado
 * * Proporciona paginación estándar y consistente en toda la aplicación
 */
export class PaginationDto {
  /**
   * Page number to retrieve
   *
   * * Número de página a recuperar (empieza en 1)
   */
  @ApiProperty({
    description: 'Page number to retrieve (starts at 1)',
    example: 1,
    minimum: 1,
    maximum: 1000,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  page?: number = 1;

  /**
   * Number of items per page
   *
   * * Número de elementos por página (máximo 100)
   */
  @ApiProperty({
    description: 'Number of items per page (maximum 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Search and Sort Query DTO
 *
 * Common search and sorting parameters for API endpoints.
 * Extends pagination with search and ordering capabilities.
 *
 * * Parámetros comunes de búsqueda y ordenamiento
 */
export class SearchSortDto extends PaginationDto {
  /**
   * Search term for filtering results
   *
   * ? Término de búsqueda para filtrar resultados
   */
  @ApiProperty({
    description: 'Search term for filtering results',
    example: 'computer science',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Field to sort by
   *
   * * Campo por el cual ordenar los resultados
   */
  @ApiProperty({
    description: 'Field to sort by',
    example: 'name',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  /**
   * Sort direction
   *
   * * Dirección del ordenamiento (ascendente o descendente)
   */
  @ApiProperty({
    description: 'Sort direction (ascending or descending)',
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'asc',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

/**
 * Active Status Filter DTO
 *
 * Common filter for active/inactive status across entities.
 * Can be combined with other DTOs for comprehensive filtering.
 *
 * ? Filtro común para estado activo/inactivo
 */
export class ActiveFilterDto {
  /**
   * Filter by active status
   *
   * * Filtrar por estado activo/inactivo
   */
  @ApiProperty({
    description:
      'Filter by active status (true for active, false for inactive)',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}

/**
 * Date Range Filter DTO
 *
 * Common date range filtering for entities with timestamp fields.
 * Useful for filtering by creation date, update date, or other date fields.
 *
 * * Filtro común por rango de fechas
 */
export class DateRangeDto {
  /**
   * Start date for filtering
   *
   * * Fecha de inicio para el filtro
   */
  @ApiProperty({
    description: 'Start date for filtering (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  /**
   * End date for filtering
   *
   * * Fecha de fin para el filtro
   */
  @ApiProperty({
    description: 'End date for filtering (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}

/**
 * Comprehensive Query DTO
 *
 * Combines all common query parameters for maximum flexibility.
 * Use this for endpoints that need full query capabilities.
 *
 * ! IMPORTANTE: DTO completo para consultas complejas
 */
export class ComprehensiveQueryDto extends SearchSortDto {
  /**
   * Filter by active status
   */
  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  /**
   * Start date for filtering
   */
  @ApiProperty({
    description: 'Start date for filtering',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  /**
   * End date for filtering
   */
  @ApiProperty({
    description: 'End date for filtering',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
