import { IntersectionType } from '@nestjs/mapped-types';
import { LoginAuthDto } from './login-auth.dto';
import { MaxLength, MinLength, IsOptional, IsBoolean, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
        description: 'User full legal name for official records and identification',
        example: 'John Michael Doe',
        minLength: 3,
        maxLength: 50,
        required: true
    })
    @IsString({ message: 'Name must be a string' })
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    @MaxLength(50, { message: 'Name must be at most 50 characters long' })
    name: string;

    /**
     * User's display name for UI presentation
     *
     * Friendly name shown throughout the application interface.
     * Can be different from legal name for user preference.
     */
    @ApiProperty({
        description: 'Display name shown in the application interface',
        example: 'John Doe',
        maxLength: 100,
        required: true
    })
    @IsString({ message: 'Display name must be a string' })
    @MaxLength(100, { message: 'Display name must be at most 100 characters long' })
    displayName: string;

    /**
     * External system identifier (optional)
     *
     * Used for integration with external systems like student information systems,
     * HR systems, or other identity providers. Allows for seamless data correlation.
     */
    @ApiProperty({
        description: 'External system identifier for integration purposes',
        example: 'ext_usr_abc123def456',
        required: false
    })
    @IsOptional()
    @IsString({ message: 'External ID must be a string' })
    externalId?: string;

    /**
     * Account activation status (optional)
     *
     * Controls whether the user account is active upon creation.
     * Defaults to true for standard registration, but can be set to false
     * for administrative approval workflows.
     */
    @ApiProperty({
        description: 'Account activation status - controls immediate access',
        example: true,
        default: true,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Active status must be a boolean value' })
    active?: boolean;

    /**
     * Google account identifier (optional)
     *
     * Unique identifier from Google OAuth for account linking.
     * Automatically populated during Google Sign-In registration.
     */
    @ApiProperty({
        description: 'Google account identifier for OAuth integration',
        example: 'google_108234567890123456789',
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Google ID must be a string' })
    googleId?: string;

    /**
     * User's first name (optional)
     *
     * Extracted from Google profile or manually provided.
     * Used for personalized communication and display purposes.
     */
    @ApiProperty({
        description: 'User first name from profile or manual input',
        example: 'John',
        maxLength: 50,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'First name must be a string' })
    @MaxLength(50, { message: 'First name must be at most 50 characters long' })
    firstName?: string;

    /**
     * User's last name (optional)
     *
     * Extracted from Google profile or manually provided.
     * Used in combination with firstName for complete name display.
     */
    @ApiProperty({
        description: 'User last name from profile or manual input',
        example: 'Doe',
        maxLength: 50,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Last name must be a string' })
    @MaxLength(50, { message: 'Last name must be at most 50 characters long' })
    lastName?: string;

    /**
     * User's profile picture URL (optional)
     *
     * Profile image URL from Google OAuth or other sources.
     * Enhances user experience with visual identification.
     */
    @ApiProperty({
        description: 'Profile picture URL for user avatar display',
        example: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        format: 'uri',
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Picture URL must be a string' })
    @IsUrl({}, { message: 'Picture must be a valid URL' })
    picture?: string;
}

