import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * StudentResponseDto - Data Transfer Object for student responses
 *
 * This DTO defines the structure of student data returned by the API.
 * Includes MongoDB ID (_id) for database identification and business identifiers.
 *
 * ID Usage:
 * - _id: MongoDB ObjectId - Used for internal database operations and references
 * - code: Student identification code - Used for business logic and student identification
 */
export class StudentResponseDto {
  @ApiProperty({
    description: 'MongoDB ObjectId - Internal database identifier for the student',
    example: '60d5ecb8b0a7c4b4b8b9b1a4',
    required: false,
  })
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiProperty({
    description: 'Unique student identification code',
    example: 'CS2024001',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Student first name',
    example: 'Maria',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Rodriguez',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Computed full name for display purposes',
    example: 'Maria Rodriguez',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Associated academic program identifier (MongoDB ObjectId)',
    example: '60d5ecb8b0a7c4b4b8b9b1a1',
  })
  @IsString()
  programId: string;

  @ApiProperty({
    description: 'Current academic semester (1-12)',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  currentSemester: number;

  @ApiProperty({
    description: 'Student registration timestamp',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    description: 'Last profile update timestamp',
    example: '2024-01-20T14:45:00.000Z',
    required: false,
  })
  @IsOptional()
  updatedAt?: Date;
}
