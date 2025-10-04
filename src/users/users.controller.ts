import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './services/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AdminOnly } from '../auth/decorators/auth.decorator';

/**
 * Users Controller
 *
 * Manages user account operations for authentication and authorization.
 * Handles user CRUD operations with proper permissions and data validation.
 *
 * @version 1.0.0
 */
@ApiTags('User Management')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user account
   *
   * Registers a new user with authentication credentials and role assignments.
   */
  @ApiOperation({
    summary: 'Create new user account',
    description: `
    Creates a new user account in the system with authentication credentials.

    **Features:**
    - User authentication setup
    - Role-based access control assignment
    - External ID linking for student records
    - Email validation and uniqueness checks

    **Use Cases:**
    - New user registration
    - Administrative user creation
    - Student account initialization
    `,
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User account creation data',
    examples: {
      student: {
        summary: 'Student User Account',
        value: {
          externalId: 'STU001',
          email: 'student@example.edu',
          displayName: 'John Doe',
          active: true,
          roles: ['STUDENT'],
          password: 'securePassword123',
        },
      },
      admin: {
        summary: 'Admin User Account',
        value: {
          externalId: 'ADM001',
          email: 'admin@example.edu',
          displayName: 'Admin User',
          active: true,
          roles: ['ADMIN'],
          password: 'securePassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user data',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or external ID already exists',
  })
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  /**
   * Get all users
   *
   * Retrieves a list of all user accounts in the system.
   * Requires admin privileges.
   */
  @ApiOperation({
    summary: 'Get all user accounts',
    description: `
    Retrieves all registered user accounts from the system.

    **Response Features:**
    - Complete user profiles (excluding passwords)
    - MongoDB _id for database operations
    - External ID for business logic linking
    - Role and status information

    **Access Control:**
    - Requires ADMIN role
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - Admin role required',
  })
  @AdminOnly()
  @Get()
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  /**
   * Get user by ID
   *
   * Retrieves a specific user account by MongoDB ObjectId.
   */
  @ApiOperation({
    summary: 'Get user by database ID',
    description: `
    Retrieves detailed user information by MongoDB ObjectId.

    **Response includes:**
    - User profile data (excluding password)
    - MongoDB _id for database references
    - External ID for business logic
    - Account status and roles
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ObjectId format',
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  /**
   * Update user account
   *
   * Updates existing user account information.
   */
  @ApiOperation({
    summary: 'Update user account information',
    description: `
    Updates user account details with partial or complete data.

    **Updatable Fields:**
    - Display name
    - Email address (with uniqueness validation)
    - Active status
    - Roles assignment
    - Password (will be hashed)

    **Data Integrity:**
    - Email uniqueness validation
    - Role validation
    - Maintains audit trail with timestamps
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data (partial updates supported)',
    examples: {
      updateName: {
        summary: 'Update Display Name',
        value: {
          displayName: 'Jane Smith',
        },
      },
      updateStatus: {
        summary: 'Deactivate Account',
        value: {
          active: false,
        },
      },
      updateRoles: {
        summary: 'Update User Roles',
        value: {
          roles: ['STUDENT', 'DEAN'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data',
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Delete user account
   *
   * Permanently removes a user account from the system.
   */
  @ApiOperation({
    summary: 'Delete user account',
    description: `
    Permanently removes a user account from the database.

    **⚠️ WARNING:**
    - This is a permanent operation
    - User authentication will be revoked
    - Consider deactivation as an alternative

    **Use Cases:**
    - Administrative cleanup
    - Duplicate account removal
    - Data privacy compliance
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
