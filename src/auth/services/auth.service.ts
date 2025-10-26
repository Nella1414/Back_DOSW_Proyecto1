// Import necessary modules and dependencies for authentication functionality
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { hash, compare } from 'bcrypt'; // For password hashing and comparison

// Import Data Transfer Objects (DTOs) for request validation
import { LoginAuthDto } from '../dto/login-auth.dto';
import { RegisterAuthDto } from '../dto/register-auth.dto';

// Import User entity and types for database operations
import { User, UserDocument } from '../../users/entities/user.entity';
import { RoleName } from '../../roles/entities/role.entity';
import {
  Student,
  StudentDocument,
} from '../../students/entities/student.entity';

// UUID library for generating unique external IDs
import { v4 as uuidv4 } from 'uuid';

/**
 * AuthService handles all authentication-related operations including:
 * - User registration and login
 * - Password hashing and verification
 * - JWT token generation
 * - Google OAuth integration
 * - User role management
 *
 * This service is the core of the authentication system and ensures
 * secure user management throughout the application.
 */
@Injectable()
export class AuthService {
  // Logger instance for tracking authentication events and errors
  private readonly logger = new Logger(AuthService.name);

  /**
   * Constructor injects dependencies needed for authentication:
   * @param userModel - MongoDB model for user operations
   * @param studentModel - MongoDB model for student operations
   * @param jwtService - Service for generating and validating JWT tokens
   */
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
    private readonly jwtService: JwtService,
  ) {}
  /**
   * Registers a new user in the system
   *
   * Process:
   * 1. Check if user with email already exists
   * 2. Hash the password for secure storage
   * 3. Create new user record in database
   * 4. Return user data without password
   *
   * @param userObject - Registration data containing email, password, and display name
   * @returns Promise<User> - Created user object without password
   * @throws HttpException - If user already exists or registration fails
   */
  async register(userObject: RegisterAuthDto) {
    try {
      // Step 1: Check if user with this email already exists
      const findUser = await this.userModel.findOne({
        email: userObject.email,
      });
      if (findUser) {
        throw new HttpException('USER_ALREADY_EXISTS', HttpStatus.CONFLICT);
      }

      // ? Critical: Password must be hashed before storage for security
      const { password, ...userData } = userObject;
      const hashedPassword = await hash(password, 10);

      // Step 3: Create new user in database with hashed password
      // All new users are students by default
      const newUser = await this.userModel.create({
        ...userData,
        password: hashedPassword,
        roles: [RoleName.STUDENT], // Default role
      });

      // Step 4: Create associated student profile automatically
      try {
        // Validate programId is provided
        if (!userObject.programId) {
          throw new Error('Program ID is required for student registration');
        }

        // Generate student code: SIS + year + sequential number
        const currentYear = new Date().getFullYear();
        const studentCount = await this.studentModel.countDocuments();
        const studentCode = `SIS${currentYear}${String(studentCount + 1).padStart(4, '0')}`;

        // Extract first and last name from displayName
        const nameParts = userObject.displayName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];

        // Create student record with programId
        await this.studentModel.create({
          code: studentCode,
          firstName: firstName,
          lastName: lastName,
          externalId: newUser.externalId,
          programId: userObject.programId, // Add programId
          currentSemester: 1, // Start at semester 1
        });

        this.logger.log(`Student profile created: ${studentCode} for user: ${newUser.email}`);
      } catch (studentError) {
        // If student creation fails, rollback user creation and throw error
        await this.userModel.deleteOne({ _id: newUser._id });
        this.logger.error('Failed to create student profile', {
          userId: newUser._id,
          error: studentError.message,
        });
        throw new HttpException(
          `Error al crear perfil de estudiante: ${studentError.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // ? Critical: Never return password in API responses for security
      const { password: _, ...userResponse } = newUser.toObject();
      return userResponse;
    } catch (error) {
      // Handle known errors first
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle MongoDB duplicate key error (email already exists)
      if (error.code === 11000) {
        throw new HttpException('EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
      }

      // Log unexpected errors securely (without sensitive data)
      this.logger.error('Registration failed', {
        email: userObject.email,
        errorType: error.constructor.name,
      });

      // Throw generic error to prevent information leakage
      throw new HttpException(
        'REGISTRATION_FAILED',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Authenticates a user and returns JWT token
   *
   * Authentication process:
   * 1. Find user by email
   * 2. Validate user status (exists, active, has password)
   * 3. Compare provided password with stored hash
   * 4. Generate JWT token with user information
   * 5. Return user data and access token
   *
   * @param loginObject - Login credentials (email and password)
   * @returns Promise<LoginResponse> - User data and JWT access token
   * @throws HttpException - If authentication fails at any step
   */
  async login(loginObject: LoginAuthDto) {
    try {
      // Extract email and password from login request
      const { email, password } = loginObject;

      // Step 1: Find user by email in database
      const findUser = await this.userModel.findOne({ email });

      if (!findUser) {
        throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      // Step 2: Check if user account is active
      if (!findUser.active) {
        throw new HttpException('USER_INACTIVE', HttpStatus.FORBIDDEN);
      }

      // Step 3: Ensure user has a password (not OAuth-only user)
      if (!findUser.password) {
        throw new HttpException(
          'INVALID_USER_DATA',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Step 4: Compare provided password with stored hash
      const checkPassword = await compare(password, findUser.password);

      if (!checkPassword) {
        throw new HttpException('PASSWORD_INCORRECT', HttpStatus.FORBIDDEN);
      }

      // Step 5: Generate JWT token with user information
      const payload = {
        sub: findUser._id, // Subject (user ID)
        email: findUser.email, // User email
        roles: findUser.roles, // User roles for authorization
      };

      const accessToken = this.jwtService.sign(payload);

      // Step 6: Get student code if user is a student
      let studentCode: string | undefined;
      if (findUser.roles.includes(RoleName.STUDENT)) {
        const student = await this.studentModel.findOne({
          externalId: findUser.externalId,
        });
        if (student) {
          studentCode = student.code;
        }
      }

      // Step 7: Return user data and token (exclude sensitive information)
      return {
        user: {
          id: findUser._id,
          email: findUser.email,
          displayName: findUser.displayName,
          externalId: findUser.externalId,
          roles: findUser.roles,
          active: findUser.active,
          studentCode, // Include student code if available
        },
        accessToken,
        tokenType: 'Bearer', // Standard OAuth 2.0 token type
      };
    } catch (error) {
      // Re-throw known HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unexpected errors securely
      throw new HttpException('LOGIN_FAILED', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Updates user roles (Admin only operation)
   *
   * This method allows administrators to change user roles.
   * Used for promoting users, changing permissions, etc.
   *
   * @param userId - MongoDB ObjectId of the user to update
   * @param newRoles - Array of new roles to assign to the user
   * @returns Promise<User> - Updated user object
   * @throws HttpException - If user not found
   */
  async updateUserRoles(userId: string, newRoles: RoleName[]): Promise<User> {
    // Update user roles in database and return new document
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { roles: newRoles },
      { new: true }, // Return updated document instead of original
    );

    // Check if user exists
    if (!user) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  /**
   * Validates JWT token and retrieves user information
   *
   * This method is used by the JWT strategy to validate tokens
   * and retrieve user data for each authenticated request.
   *
   * @param userId - User ID extracted from JWT token
   * @returns Promise<User | null> - User object if valid, null if invalid
   */
  async validateUser(userId: string): Promise<User | null> {
    // Find user by ID from JWT payload
    const user = await this.userModel.findById(userId);

    // Return null if user doesn't exist or is inactive
    // This will cause the JWT strategy to reject the token
    if (!user || !user.active) {
      return null;
    }

    return user;
  }

  /**
   * Handles Google OAuth authentication
   *
   * This method processes users who authenticate via Google OAuth:
   * 1. Check if user exists by email
   * 2. Create new user if not found
   * 3. Update existing user with Google info if needed
   * 4. Generate JWT token for the session
   *
   * @param googleUser - User data from Google OAuth provider
   * @returns Promise<LoginResponse> - User data and access token
   * @throws HttpException - If Google authentication fails
   */
  async googleLogin(googleUser: any) {
    try {
      // Step 1: Search for existing user by email
      let user = await this.userModel.findOne({ email: googleUser.email });
      let isNewUser = false;

      if (!user) {
        // Step 2a: Create new user if not found
        isNewUser = true;
        user = await this.userModel.create({
          email: googleUser.email,
          displayName: `${googleUser.firstName} ${googleUser.lastName}`,
          externalId: uuidv4(), // Generate unique external ID
          roles: [RoleName.STUDENT], // Default role for new Google users
          active: true,

          // Store Google-specific information
          googleId: googleUser.googleId,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          picture: googleUser.picture,
          isGoogleUser: true,
          // Note: No password field since this is OAuth user
        });

        // Step 2a.1: Create student profile for new Google user
        try {
          const currentYear = new Date().getFullYear();
          const studentCount = await this.studentModel.countDocuments();
          const studentCode = `SIS${currentYear}${String(studentCount + 1).padStart(4, '0')}`;

          await this.studentModel.create({
            code: studentCode,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            externalId: user.externalId,
            currentSemester: 1,
          });

          this.logger.log(`Student profile created for Google user: ${studentCode}`);
        } catch (studentError) {
          this.logger.error('Failed to create student profile for Google user', {
            userId: user._id,
            error: studentError.message,
          });
        }
      } else {
        // Step 2b: Update existing user with Google info if needed
        if (!user.googleId) {
          await this.userModel.findByIdAndUpdate(user._id, {
            googleId: googleUser.googleId,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            picture: googleUser.picture,
            isGoogleUser: true,
          });
        }
      }

      // Step 3: Generate JWT token with user information
      const payload = {
        sub: user._id,
        email: user.email,
        roles: user.roles,
      };

      const accessToken = this.jwtService.sign(payload);

      // Step 4: Get student code if user is a student
      let studentCode: string | undefined;
      if (user.roles.includes(RoleName.STUDENT)) {
        const student = await this.studentModel.findOne({
          externalId: user.externalId,
        });
        if (student) {
          studentCode = student.code;
        }
      }

      // Step 5: Return user data and token
      return {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          externalId: user.externalId,
          roles: user.roles,
          active: user.active,
          picture: user.picture,
          isGoogleUser: true,
          studentCode, // Include student code if available
        },
        accessToken,
        tokenType: 'Bearer',
      };
    } catch (error) {
      // Log error securely without exposing sensitive data
      this.logger.error('Google login failed', {
        email: googleUser?.email,
        errorType: error.constructor.name,
      });

      throw new HttpException(
        'GOOGLE_LOGIN_FAILED',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
