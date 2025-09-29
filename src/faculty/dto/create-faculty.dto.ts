import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsEmail,
  Length,
  Matches,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Faculty DTO
 *
 * Data Transfer Object for creating new faculties in the institutional structure.
 * This DTO validates and structures the input data required to establish
 * a new faculty with organizational hierarchy, dean assignments, and contact information.
 *
 * ! IMPORTANTE: Las facultades son unidades organizacionales críticas
 * ! que agrupan programas académicos y deben ser creadas cuidadosamente
 */
export class CreateFacultyDto {
  /**
   * Unique faculty identification code
   *
   * * Debe ser único en toda la institución
   * ? Formato sugerido: FAC-[AREA] (ej: FAC-ENG, FAC-MED)
   */
  @ApiProperty({
    description: 'Unique faculty identification code',
    example: 'FAC-ENG',
    minLength: 5,
    maxLength: 20,
    pattern: '^FAC-[A-Z]{3,10}$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  @Matches(/^FAC-[A-Z]{3,10}$/, {
    message:
      'Faculty code must follow format: FAC-[LETTERS] (e.g., FAC-ENG, FAC-MED)',
  })
  code: string;

  /**
   * Complete faculty name
   *
   * * Nombre oficial completo de la facultad
   */
  @ApiProperty({
    description: 'Complete official faculty name',
    example: 'Faculty of Engineering',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  name: string;

  /**
   * Dean user ID assignment
   *
   * ? ID del usuario que será asignado como decano
   * * Opcional - la facultad puede crearse sin decano inicialmente
   */
  @ApiProperty({
    description: 'MongoDB ObjectId of the user assigned as dean',
    example: '674a1b2c3d4e5f6g7h8i9j0k',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
  deanId?: string;

  /**
   * Whether the faculty is currently active
   *
   * * Controla si la facultad está operativa
   * * Por defecto: true
   */
  @ApiProperty({
    description: 'Whether the faculty is currently active and operational',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /**
   * Detailed faculty description
   *
   * ? Descripción detallada de la facultad y sus áreas académicas
   */
  @ApiProperty({
    description: 'Detailed description of the faculty and its academic areas',
    example:
      'Faculty responsible for engineering programs including systems, civil, electrical, and mechanical engineering',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  /**
   * Official faculty email
   *
   * * Email oficial de contacto de la facultad
   */
  @ApiProperty({
    description: 'Official faculty contact email address',
    example: 'engineering@university.edu',
    format: 'email',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  /**
   * Faculty contact phone number
   *
   * * Número de teléfono de contacto de la facultad
   */
  @ApiProperty({
    description: 'Faculty contact phone number',
    example: '+57 1 234-5678',
    pattern: '^\\+?[1-9]\\d{1,14}$',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid international format',
  })
  phone?: string;
}
