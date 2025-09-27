// Import validation decorators for email and string length validation
import { IsEmail, MaxLength, MinLength } from "class-validator";
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
        description: 'User email address for authentication',
        example: 'user@example.com',
        format: 'email'
    })
    @IsEmail({}, { message: 'Invalid email format' })
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
        description: 'User password for authentication',
        example: 'SecurePassword123',
        minLength: 6,
        maxLength: 100
    })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(100, { message: 'Password must be at most 100 characters long' })
    password: string;
}