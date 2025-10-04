import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../entities/user.entity';
import { Model } from 'mongoose';

/**
 * Users Management Service
 *
 * Handles user account management for system authentication and authorization.
 * Manages user accounts separately from student academic profiles.
 *
 * Features:
 * - CRUD operations for user accounts
 * - Password exclusion from responses
 * - MongoDB _id population for database operations
 * - Proper error handling with NotFoundException
 */
@Injectable()
export class UsersService {
  /**
   * Constructor injects User MongoDB model
   * @param usersModule - Mongoose model for User collection operations
   */
  constructor(
    @InjectModel(User.name) private usersModule: Model<UserDocument>,
  ) {}

  /**
   * Create new user account
   *
   * Creates a user account in the database with authentication details.
   * Returns user data including MongoDB _id for database operations.
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const userCreated = await this.usersModule.create(createUserDto);
    return this.toResponseDto(userCreated);
  }

  /**
   * Get all users
   *
   * Retrieves all user accounts from the database.
   * Excludes sensitive data like passwords from the response.
   * Returns users with MongoDB _id for reference operations.
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersModule.find({}).select('-password').exec();
    return users.map((user) => this.toResponseDto(user));
  }

  /**
   * Find user by ID
   *
   * Retrieves a specific user by their MongoDB ObjectId.
   * Excludes password from the response for security.
   *
   * @throws NotFoundException if user is not found
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersModule
      .findById(id)
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.toResponseDto(user);
  }

  /**
   * Update user information
   *
   * Updates user account details by MongoDB ObjectId.
   * Excludes password from the response for security.
   * Returns the updated user data with MongoDB _id.
   *
   * @throws NotFoundException if user is not found
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersModule
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.toResponseDto(updatedUser);
  }

  /**
   * Remove user from system
   *
   * Deletes a user account from the database.
   * Performs hard delete - user record is permanently removed.
   *
   * @throws NotFoundException if user is not found
   */
  async remove(id: string): Promise<void> {
    const result = await this.usersModule.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  /**
   * Convert User document to UserResponseDto
   *
   * Transforms database entity to response DTO format.
   * Includes MongoDB _id as string for client-side operations.
   */
  private toResponseDto(user: UserDocument): UserResponseDto {
    return {
      _id: user._id?.toString(),
      externalId: user.externalId,
      email: user.email,
      displayName: user.displayName,
      active: user.active,
      roles: user.roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
