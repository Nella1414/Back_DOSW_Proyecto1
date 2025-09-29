import { Controller, Post, Body, Param, Get, Put, UseGuards, Req, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiExcludeEndpoint,
  ApiSecurity,
  ApiConsumes,
  ApiProduces
} from '@nestjs/swagger';

import { AuthService } from './services/auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { AdminOnly, Public } from './decorators/auth.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';

/**
 * Authentication Controller
 *
 * Handles all authentication-related endpoints including user registration,
 * login, Google OAuth integration, and administrative user management.
 *
 * @version 1.0.0
 * @author SIRHA Development Team
 */
@ApiTags('Authentication')
@Controller('auth')
@ApiProduces('application/json')
@ApiConsumes('application/json')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService
  ) {}

  /**
   * Register a new user account
   *
   * Creates a new user account with email/password authentication.
   * All new users are assigned the STUDENT role by default.
   */
  @ApiOperation({
    summary: 'Register new user account',
    description: `
    Creates a new user account in the SIRHA system with the following features:

    - **Email Validation**: Ensures unique and valid email format
    - **Password Security**: Automatic bcrypt hashing with salt rounds
    - **Default Role**: New users receive STUDENT role automatically
    - **Account Activation**: Accounts are activated immediately upon creation

    **Use Cases:**
    - Self-registration for students
    - Administrative account creation
    - Initial system setup
    `,
    operationId: 'registerUser'
  })
  @ApiBody({
    type: RegisterAuthDto,
    description: 'User registration information',
    examples: {
      student: {
        summary: 'Student Registration',
        description: 'Example registration for a new student',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePassword123!',
          displayName: 'John Doe',
          name: 'John Doe'
        }
      },
      admin: {
        summary: 'Administrator Registration',
        description: 'Example registration for system administrator',
        value: {
          email: 'admin@example.com',
          password: 'AdminSecure456!',
          displayName: 'System Administrator',
          name: 'Admin User'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'User account created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          example: '60d5ecb8b0a7c4b4b8b9b1a1',
          description: 'Unique user identifier'
        },
        email: {
          type: 'string',
          example: 'john.doe@example.com',
          description: 'User email address'
        },
        displayName: {
          type: 'string',
          example: 'John Doe',
          description: 'User display name'
        },
        externalId: {
          type: 'string',
          example: 'usr_abc123def456',
          description: 'External identifier for integrations'
        },
        roles: {
          type: 'array',
          items: { type: 'string' },
          example: ['STUDENT'],
          description: 'Assigned user roles'
        },
        active: {
          type: 'boolean',
          example: true,
          description: 'Account activation status'
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Registration conflict - User already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'USER_ALREADY_EXISTS' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Invalid email format', 'Password must be at least 6 characters long']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @Public()
  @Post('register')
  async registerUser(@Body() userObject: RegisterAuthDto) {
    return this.authService.register(userObject);
  }

  /**
   * Authenticate user and generate access token
   *
   * Validates user credentials and returns a JWT access token for API authentication.
   */
  @ApiOperation({
    summary: 'User authentication and login',
    description: `
    Authenticates user credentials and generates a secure JWT access token.

    **Authentication Process:**
    1. **Email Verification**: Validates email exists in system
    2. **Password Validation**: Compares against stored bcrypt hash
    3. **Account Status Check**: Ensures account is active
    4. **Token Generation**: Creates JWT with user information and roles

    **Security Features:**
    - Rate limiting protection (100 requests/minute)
    - Secure password comparison with bcrypt
    - JWT tokens with configurable expiration
    - User role information embedded in token

    **Token Usage:**
    Include the returned token in Authorization header:
    \`Authorization: Bearer <accessToken>\`
    `,
    operationId: 'loginUser'
  })
  @ApiBody({
    type: LoginAuthDto,
    description: 'User login credentials',
    examples: {
      student: {
        summary: 'Student Login',
        description: 'Login example for student account',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePassword123!'
        }
      },
      admin: {
        summary: 'Administrator Login',
        description: 'Login example for admin account',
        value: {
          email: 'admin@example.com',
          password: 'AdminSecure456!'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful - Returns user data and access token',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '60d5ecb8b0a7c4b4b8b9b1a1',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              example: 'john.doe@example.com',
              description: 'User email address'
            },
            displayName: {
              type: 'string',
              example: 'John Doe',
              description: 'User display name'
            },
            roles: {
              type: 'array',
              items: { type: 'string' },
              example: ['STUDENT'],
              description: 'User roles for authorization'
            },
            active: {
              type: 'boolean',
              example: true,
              description: 'Account status'
            }
          }
        },
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT access token for API authentication'
        },
        tokenType: {
          type: 'string',
          example: 'Bearer',
          description: 'Token type for Authorization header'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed - Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'PASSWORD_INCORRECT' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'USER_NOT_FOUND' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Account inactive or access denied',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'USER_INACTIVE' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @Public()
  @Post('login')
  async loginUser(@Body() loginObject: LoginAuthDto) {
    return this.authService.login(loginObject);
  }

  /**
   * Update user roles (Administrator only)
   *
   * Allows system administrators to modify user role assignments.
   * This endpoint requires ADMIN privileges and affects user permissions system-wide.
   */
  @ApiOperation({
    summary: 'Update user role assignments',
    description: `
    Administrative endpoint for managing user role assignments.

    **Available Roles:**
    - **ADMIN**: Full system access, can manage all users and data
    - **DEAN**: Academic management, can manage courses and students
    - **STUDENT**: Basic access, can view own data and course information

    **Security Notes:**
    - Requires Administrator authentication
    - Changes take effect immediately
    - Role modifications are logged for audit purposes
    - Cannot remove all ADMIN roles from the system

    **Use Cases:**
    - Promote students to dean positions
    - Grant administrative access to staff
    - Manage role-based permissions
    `,
    operationId: 'updateUserRoles'
  })
  @ApiParam({
    name: 'userId',
    description: 'MongoDB ObjectId of the user to update',
    example: '60d5ecb8b0a7c4b4b8b9b1a1',
    type: 'string'
  })
  @ApiBody({
    description: 'Role assignment data',
    schema: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['ADMIN', 'DEAN', 'STUDENT']
          },
          example: ['DEAN'],
          description: 'Array of roles to assign to the user'
        }
      },
      required: ['roles']
    },
    examples: {
      promoteToAdmin: {
        summary: 'Promote to Administrator',
        description: 'Grant full administrative access',
        value: { roles: ['ADMIN'] }
      },
      assignDean: {
        summary: 'Assign Dean Role',
        description: 'Grant academic administrative access',
        value: { roles: ['DEAN'] }
      },
      multipleRoles: {
        summary: 'Multiple Role Assignment',
        description: 'Assign multiple roles to user',
        value: { roles: ['DEAN', 'STUDENT'] }
      },
      demoteToStudent: {
        summary: 'Demote to Student',
        description: 'Restrict to basic student access',
        value: { roles: ['STUDENT'] }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User roles updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          example: '60d5ecb8b0a7c4b4b8b9b1a1',
          description: 'User identifier'
        },
        email: {
          type: 'string',
          example: 'john.doe@example.com',
          description: 'User email'
        },
        displayName: {
          type: 'string',
          example: 'John Doe',
          description: 'User display name'
        },
        roles: {
          type: 'array',
          items: { type: 'string' },
          example: ['DEAN'],
          description: 'Updated user roles'
        },
        active: {
          type: 'boolean',
          example: true,
          description: 'Account status'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Admin privileges required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: {
          type: 'string',
          example: 'Access denied. One of the following roles is required: ADMIN'
        },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'USER_NOT_FOUND' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiBearerAuth()
  @AdminOnly()
  @Put('user/:userId/roles')
  async updateUserRoles(
    @Param('userId') userId: string,
    @Body() body: { roles: RoleName[] }
  ) {
    return this.authService.updateUserRoles(userId, body.roles);
  }

  /**
   * Initiate Google OAuth authentication
   *
   * Redirects users to Google's OAuth consent screen for authentication.
   * This endpoint starts the Google Sign-In flow.
   */
  @ApiOperation({
    summary: 'Initiate Google OAuth authentication',
    description: `
    Redirects to Google OAuth consent screen for user authentication.

    **OAuth Flow:**
    1. User clicks Google Sign-In button
    2. Redirected to this endpoint
    3. System redirects to Google OAuth consent screen
    4. User authenticates with Google
    5. Google redirects back to callback endpoint
    6. System processes authentication and returns token

    **Integration Notes:**
    - Requires Google OAuth configuration in environment
    - Automatically creates accounts for new Google users
    - Links existing accounts by email address
    - Returns same token format as email/password login
    `,
    operationId: 'googleAuth'
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth consent screen',
    headers: {
      Location: {
        description: 'Google OAuth URL',
        schema: {
          type: 'string',
          example: 'https://accounts.google.com/oauth/authorize?client_id=...'
        }
      }
    }
  })
  @ApiExcludeEndpoint()
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Automatic redirect to Google OAuth
  }

  /**
   * Handle Google OAuth callback
   *
   * Processes the response from Google OAuth and completes user authentication.
   * This endpoint is called automatically by Google after user consent.
   */
  @ApiOperation({
    summary: 'Google OAuth callback handler',
    description: `
    Handles the callback from Google OAuth and completes authentication.

    **Process:**
    1. Receives authorization code from Google
    2. Exchanges code for user information
    3. Creates or links user account
    4. Generates JWT access token
    5. Redirects to frontend with token

    **Account Handling:**
    - New users: Creates account with STUDENT role
    - Existing users: Links Google account to existing profile
    - Returns JWT token for immediate access
    `,
    operationId: 'googleAuthCallback'
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with authentication token',
    headers: {
      Location: {
        description: 'Frontend URL with access token',
        schema: {
          type: 'string',
          example: 'http://localhost:3001/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Google authentication failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'GOOGLE_LOGIN_FAILED' },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  @ApiExcludeEndpoint()
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req.user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.accessToken}`;

    return res.redirect(redirectUrl);
  }
}
