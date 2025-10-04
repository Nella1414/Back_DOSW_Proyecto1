import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsBoolean, IsArray, IsOptional } from 'class-validator';

/**
 * UserResponseDto - Data Transfer Object for user responses
 *
 * This DTO defines the structure of user data returned by the API.
 * Includes MongoDB ID (_id) for database identification and external ID for business logic.
 *
 * ID Usage:
 * - _id: MongoDB ObjectId - Used for internal database operations and references
 * - externalId: External identifier - Used for business logic and integration with student records
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'MongoDB ObjectId - Internal database identifier for the user',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiProperty({
    description: 'External ID - Business identifier linked to student records (e.g., STU001)',
    example: 'STU001',
  })
  @IsString()
  externalId: string;

  @ApiProperty({
    description: 'User email address for authentication and communication',
    example: 'juan.perez@estudiante.edu',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Display name for the user interface',
    example: 'Juan Pérez',
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'Account status - true if active, false if deactivated',
    example: true,
  })
  @IsBoolean()
  active: boolean;

  @ApiProperty({
    description: 'User roles for authorization (STUDENT, ADMIN, DEAN, etc.)',
    example: ['STUDENT'],
    isArray: true,
  })
  @IsArray()
  roles: string[];

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T14:45:00.000Z',
    required: false,
  })
  @IsOptional()
  updatedAt?: Date;
}
