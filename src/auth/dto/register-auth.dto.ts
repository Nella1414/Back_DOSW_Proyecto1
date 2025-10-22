import { IntersectionType } from '@nestjs/mapped-types';
import { LoginAuthDto } from './login-auth.dto';
import {
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
  IsString,
  IsUrl,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidName, IsStrongPassword } from '../../common/validators/custom-validators';

/**
 * RegisterAuthDto - Data Transfer Object for user registration
 *
 * Extends LoginAuthDto to include additional registration fields required
 * for creating new user accounts in the SIRHA system. Supports both manual
 * registration and Google OAuth integration.
 *
 * Security Features:
 * - Inherits email and password validation from LoginAuthDto
 * - Name length constraints for data integrity
 * - Optional fields for flexibility in registration methods
 * - Google OAuth integration support
 * - Account activation control for administrative purposes
 *
 * Registration Types Supported:
 * - Manual email/password registration
 * - Google OAuth registration with profile data
 * - Administrative user creation with custom settings
 */
export class RegisterAuthDto extends IntersectionType(LoginAuthDto) {
  /**
   * User's full legal name
   *
   * Used for official records and system identification.
   * Required for all registration types to ensure proper user identification.
   */
  @ApiProperty({
    description: 'Nombre completo del usuario para registros oficiales',
    example: 'Juan Carlos Pérez',
    minLength: 3,
    maxLength: 100,
    required: true,
  })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @IsValidName({ message: 'El nombre solo puede contener letras, espacios y acentos' })
  name: string;

  /**
   * User's display name for UI presentation
   *
   * Friendly name shown throughout the application interface.
   * Can be different from legal name for user preference.
   */
  @ApiProperty({
    description: 'Nombre para mostrar en la interfaz de la aplicación',
    example: 'Juan Pérez',
    maxLength: 50,
    required: true,
  })
  @IsNotEmpty({ message: 'El nombre para mostrar es obligatorio' })
  @IsString({ message: 'El nombre para mostrar debe ser texto' })
  @MaxLength(50, { message: 'El nombre para mostrar no puede tener más de 50 caracteres' })
  @IsValidName({ message: 'El nombre para mostrar solo puede contener letras, espacios y acentos' })
  displayName: string;

  /**
   * External system identifier (optional)
   *
   * Used for integration with external systems like student information systems,
   * HR systems, or other identity providers. Allows for seamless data correlation.
   */
  @ApiProperty({
    description: 'Identificador de sistema externo para integración',
    example: 'ext_usr_abc123def456',
    required: false,
    pattern: '^[a-zA-Z0-9_-]+$',
  })
  @IsOptional()
  @IsString({ message: 'El ID externo debe ser texto' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'El ID externo solo puede contener letras, números, guiones y guiones bajos' })
  externalId?: string;

  /**
   * Account activation status (optional)
   *
   * Controls whether the user account is active upon creation.
   * Defaults to true for standard registration, but can be set to false
   * for administrative approval workflows.
   */
  @ApiProperty({
    description: 'Estado de activación de la cuenta - controla el acceso inmediato',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  active?: boolean;

  /**
   * Google account identifier (optional)
   *
   * Unique identifier from Google OAuth for account linking.
   * Automatically populated during Google Sign-In registration.
   */
  @ApiProperty({
    description: 'Identificador de cuenta de Google para integración OAuth',
    example: 'google_108234567890123456789',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El ID de Google debe ser texto' })
  googleId?: string;

  /**
   * User's first name (optional)
   *
   * Extracted from Google profile or manually provided.
   * Used for personalized communication and display purposes.
   */
  @ApiProperty({
    description: 'Primer nombre del usuario',
    example: 'Juan',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El primer nombre debe ser texto' })
  @MaxLength(50, { message: 'El primer nombre no puede tener más de 50 caracteres' })
  @IsValidName({ message: 'El primer nombre solo puede contener letras, espacios y acentos' })
  firstName?: string;

  /**
   * User's last name (optional)
   *
   * Extracted from Google profile or manually provided.
   * Used in combination with firstName for complete name display.
   */
  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser texto' })
  @MaxLength(50, { message: 'El apellido no puede tener más de 50 caracteres' })
  @IsValidName({ message: 'El apellido solo puede contener letras, espacios y acentos' })
  lastName?: string;

  /**
   * User's profile picture URL (optional)
   *
   * Profile image URL from Google OAuth or other sources.
   * Enhances user experience with visual identification.
   */
  @ApiProperty({
    description: 'URL de la foto de perfil del usuario',
    example: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    format: 'uri',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La URL de la foto debe ser texto' })
  @IsUrl({}, { message: 'Debe ser una URL válida (ej: https://ejemplo.com/foto.jpg)' })
  picture?: string;
}
