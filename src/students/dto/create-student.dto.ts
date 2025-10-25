// Import validation decorators from class-validator library
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
  IsEmail,
  IsMongoId,
} from 'class-validator';
// Import Swagger documentation decorator
import { ApiProperty } from '@nestjs/swagger';
// Import custom validators
import { IsStudentCode, IsValidName } from '../../common/validators/custom-validators';
import { IsValidObservations } from '../../common/validators/observations.validator';
import { SanitizeObservations } from '../../common/decorators/sanitize-observations.decorator';

/**
 * CreateStudentDto - Data Transfer Object for creating new students
 *
 * This DTO defines the structure and validation rules for student creation requests.
 * It ensures data integrity before reaching the database layer.
 *
 * Validation Features:
 * - Type checking (string, integer)
 * - Required field validation
 * - Length constraints
 * - Range validation for numbers
 * - Custom error messages for better UX
 *
 * Swagger Integration:
 * - Automatic API documentation generation
 * - Request/response examples
 * - Field descriptions for developers
 */
export class CreateStudentDto {
  /**
   * Unique identifier for the student
   *
   * Must be unique across all students in the system.
   * Used for student identification and enrollment processes.
   */
  @ApiProperty({
    description: 'Código único del estudiante (formato: 3-4 letras + 3-6 números)',
    example: 'EST001',
    pattern: '^[A-Z]{3,4}\\d{3,6}$',
  })
  @IsString({ message: 'El código del estudiante debe ser texto' })
  @IsNotEmpty({ message: 'El código del estudiante es obligatorio' })
  @IsStudentCode({ message: 'El código debe tener formato válido (ej: EST001, PROG2024)' })
  code: string;

  /**
   * Student's first name
   *
   * Used for display purposes and official records.
   */
  @ApiProperty({
    description: 'Primer nombre del estudiante',
    example: 'Juan',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'El primer nombre debe ser texto' })
  @IsNotEmpty({ message: 'El primer nombre es obligatorio' })
  @Length(2, 50, { message: 'El primer nombre debe tener entre 2 y 50 caracteres' })
  @IsValidName({ message: 'El primer nombre solo puede contener letras, espacios y acentos' })
  firstName: string;

  /**
   * Student's last name
   *
   * Combined with first name for full student identification.
   */
  @ApiProperty({
    description: 'Apellido del estudiante',
    example: 'Pérez',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  @IsValidName({ message: 'El apellido solo puede contener letras, espacios y acentos' })
  lastName: string;

  /**
   * Reference to the academic program
   *
   * Links student to their academic program.
   * Should be a valid MongoDB ObjectId referencing an existing program.
   */
  @ApiProperty({
    description: 'ID del programa académico (MongoDB ObjectId)',
    example: '60d5ecb8b0a7c4b4b8b9b1a1',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsString({ message: 'El ID del programa debe ser texto' })
  @IsNotEmpty({ message: 'El ID del programa es obligatorio' })
  @IsMongoId({ message: 'El ID del programa debe ser un ObjectId válido de MongoDB' })
  programId: string;

  /**
   * Student's email address (optional)
   *
   * Used for communication and system notifications.
   */
  @ApiProperty({
    description: 'Correo electrónico del estudiante',
    example: 'juan.perez@universidad.edu',
    required: false,
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  email?: string;

  /**
   * Student's phone number (optional)
   *
   * Contact information for emergencies and notifications.
   */
  @ApiProperty({
    description: 'Número de teléfono del estudiante',
    example: '+57 300 123 4567',
    required: false,
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'El teléfono debe tener formato válido (ej: +57 300 123 4567)' })
  phone?: string;

  /**
   * Current academic semester (optional)
   *
   * Tracks student's progress through their program.
   * Range: 1-12 semesters (typical program duration).
   */
  @ApiProperty({
    description: 'Semestre actual del estudiante (1-12)',
    example: 5,
    required: false,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional() // Field is not required
  @IsInt({ message: 'El semestre actual debe ser un número entero' })
  @Min(1, { message: 'El semestre debe ser mínimo 1' })
  @Max(12, { message: 'El semestre no puede ser mayor a 12' })
  currentSemester?: number;

  /**
   * Student observations (optional)
   *
   * Additional notes or comments about the student.
   * Automatically sanitized to remove dangerous content.
   */
  @ApiProperty({
    description: 'Observaciones adicionales sobre el estudiante',
    example: 'Estudiante destacado en matemáticas.\nRequiere apoyo en inglés.',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @IsValidObservations(2000, { message: 'Las observaciones no pueden exceder 2000 caracteres' })
  @SanitizeObservations()
  observations?: string | null;
}
