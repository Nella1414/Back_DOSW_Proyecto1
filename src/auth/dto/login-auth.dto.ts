// Import validation decorators for email and string length validation
import {
  IsEmail,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsString,
} from 'class-validator';
// Import Swagger decorator for API documentation
import { ApiProperty } from '@nestjs/swagger';

/**
 * LoginAuthDto - Data Transfer Object for user authentication
 *
 * This DTO validates user login credentials ensuring proper format
 * and security constraints before processing authentication.
 *
 * Security Features:
 * - Email format validation
 * - Password length requirements (prevents weak passwords)
 * - Input sanitization through validation
 * - Clear error messages for failed validation
 *
 * Used by AuthController login endpoint to authenticate users
 * and generate JWT tokens for subsequent API access.
 */
export class LoginAuthDto {
  /**
   * User's email address
   *
   * Must be a valid email format for authentication.
   * Used as the primary identifier for user accounts.
   */
  @ApiProperty({
    description: 'Correo electrónico del usuario para autenticación',
    example: 'usuario@ejemplo.com',
    format: 'email',
  })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsString({ message: 'El correo electrónico debe ser texto' })
  @IsEmail(
    {},
    {
      message:
        'Debe ser un correo electrónico válido (ej: usuario@dominio.com)',
    },
  )
  email: string;

  /**
   * User's password
   *
   * Security constraints:
   * - Minimum 6 characters (basic security requirement)
   * - Maximum 100 characters (prevents abuse)
   * - Will be compared against hashed password in database
   */
  @ApiProperty({
    description: 'Contraseña del usuario para autenticación',
    example: 'MiContraseña123',
    minLength: 6,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100, {
    message: 'La contraseña no puede tener más de 100 caracteres',
  })
  password: string;
}
