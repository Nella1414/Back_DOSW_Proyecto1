// Import validation decorators from class-validator library
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
// Import Swagger documentation decorator
import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Unique student code used for identification',
    example: 'EST001',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: 'Student code must be a string' })
  @IsNotEmpty({ message: 'Student code is required' })
  @Length(3, 20, {
    message: 'Student code must be between 3 and 20 characters',
  })
  code: string;

  /**
   * Student's first name
   *
   * Used for display purposes and official records.
   */
  @ApiProperty({
    description: 'Student first name',
    example: 'Juan',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
  firstName: string;

  /**
   * Student's last name
   *
   * Combined with first name for full student identification.
   */
  @ApiProperty({
    description: 'Student last name',
    example: 'Pérez',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
  lastName: string;

  /**
   * Reference to the academic program
   *
   * Links student to their academic program.
   * Should be a valid MongoDB ObjectId referencing an existing program.
   */
  @ApiProperty({
    description: 'Program ID that student belongs to (MongoDB ObjectId)',
    example: '60d5ecb8b0a7c4b4b8b9b1a1',
  })
  @IsString({ message: 'Program ID must be a string' })
  @IsNotEmpty({ message: 'Program ID is required' })
  programId: string;

  /**
   * Current academic semester (optional)
   *
   * Tracks student's progress through their program.
   * Range: 1-12 semesters (typical program duration).
   */
  @ApiProperty({
    description: 'Current semester number (1-12)',
    example: 5,
    required: false,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional() // Field is not required
  @IsInt({ message: 'Current semester must be an integer' })
  @Min(1, { message: 'Semester must be at least 1' })
  @Max(12, { message: 'Semester cannot exceed 12' })
  currentSemester?: number;
}
