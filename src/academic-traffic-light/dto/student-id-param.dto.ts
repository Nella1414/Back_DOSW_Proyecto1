import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Student ID Parameter Validation DTO
 *
 * Validates student identifiers received as URL parameters or query strings.
 * Accepts both student codes and external IDs.
 */
export class StudentIdParamDto {
  @ApiProperty({
    description:
      'Student identification code or external ID from authentication system',
    example: 'CS2024001',
    pattern: '^[A-Z0-9-_]+$',
  })
  @IsString()
  @IsNotEmpty({ message: 'Student ID cannot be empty' })
  @Matches(/^[A-Z0-9\-_]+$/i, {
    message: 'Student ID must contain only letters, numbers, hyphens and underscores',
  })
  studentId: string;
}
