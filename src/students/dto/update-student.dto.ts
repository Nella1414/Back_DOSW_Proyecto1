import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * UpdateStudentDto - Data Transfer Object for updating student information
 *
 * Extends CreateStudentDto as a partial type, allowing selective updates
 * to student profile information. All fields are optional, enabling
 * flexible partial updates without requiring complete profile replacement.
 *
 * Update Capabilities:
 * - Selective field updates (only provided fields are modified)
 * - Student code modification (with uniqueness validation)
 * - Name corrections and updates
 * - Academic program transfers
 * - Semester progression tracking
 * - Data integrity validation for all changes
 *
 * Validation Features:
 * - Inherits all validation rules from CreateStudentDto
 * - Maintains data integrity constraints
 * - Prevents invalid state transitions
 * - Ensures referential integrity with related entities
 *
 * Use Cases:
 * - Student name corrections
 * - Academic program transfers
 * - Semester advancement
 * - Profile information updates
 * - Administrative data corrections
 */
export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  /**
   * Student identification code (optional for updates)
   *
   * When provided, the system validates uniqueness across all students.
   * Useful for correcting codes or implementing new coding schemes.
   */
  @ApiProperty({
    description: 'Update student identification code (must remain unique)',
    example: 'CS2024001-NEW',
    required: false,
    minLength: 3,
    maxLength: 20,
  })
  code?: string;

  /**
   * Student first name (optional for updates)
   *
   * Allows correction of first name information.
   * Commonly used for legal name changes or error corrections.
   */
  @ApiProperty({
    description: 'Update student first name',
    example: 'María Elena',
    required: false,
    minLength: 2,
    maxLength: 50,
  })
  firstName?: string;

  /**
   * Student last name (optional for updates)
   *
   * Allows correction of last name information.
   * Important for maintaining accurate academic records.
   */
  @ApiProperty({
    description: 'Update student last name',
    example: 'Rodríguez Martinez',
    required: false,
    minLength: 2,
    maxLength: 50,
  })
  lastName?: string;

  /**
   * Academic program association (optional for updates)
   *
   * Enables program transfers while maintaining academic history.
   * Validates that the target program exists before updating.
   */
  @ApiProperty({
    description: 'Transfer student to different academic program',
    example: '60d5ecb8b0a7c4b4b8b9b1a2',
    required: false,
  })
  programId?: string;

  /**
   * Current academic semester (optional for updates)
   *
   * Tracks student progression through their academic program.
   * Commonly updated for semester advancement or corrections.
   */
  @ApiProperty({
    description: 'Update current semester (academic progression)',
    example: 6,
    required: false,
    minimum: 1,
    maximum: 12,
  })
  currentSemester?: number;
}
