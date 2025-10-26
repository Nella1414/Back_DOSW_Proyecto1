// Import NestJS decorators and exception classes for service implementation
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Import Data Transfer Objects for request/response validation
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { StudentResponseDto } from '../dto/student-response.dto';

// Import Student entity and document type for database operations
import { Student, StudentDocument } from '../entities/student.entity';
import { StudentScheduleService } from '../../schedules/services/student-schedule.service';

/**
 * StudentsService handles all business logic for student management
 *
 * This service provides CRUD (Create, Read, Update, Delete) operations
 * for student entities with proper validation and error handling.
 *
 * Features:
 * - Create new students with unique code validation
 * - Retrieve all students or find specific students by ID
 * - Update student information
 * - Delete students from the system
 * - Proper error handling with meaningful messages
 *
 * Database Integration:
 * - Uses MongoDB with Mongoose ODM
 * - Validates unique constraints (student codes)
 * - Handles database errors gracefully
 */
@Injectable()
export class StudentsService {
  /**
   * Constructor injects the Student MongoDB model
   * @param studentModel - Mongoose model for Student collection operations
   */
  constructor(
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
    private readonly studentScheduleService: StudentScheduleService,
  ) {}

  /**
   * Creates a new student in the database
   *
   * Process:
   * 1. Check if student code already exists (must be unique)
   * 2. Create new student record with provided data
   * 3. Return the created student object with MongoDB _id
   *
   * @param createStudentDto - Student data for creation
   * @returns Promise<StudentResponseDto> - The newly created student
   * @throws ConflictException - If student code already exists
   * @throws Error - If creation fails for other reasons
   */
  async create(
    createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    try {
      // Step 1: Check for existing student with same code
      const existingStudent = await this.studentModel.findOne({
        code: createStudentDto.code,
      });

      if (existingStudent) {
        throw new ConflictException('Student code already exists');
      }

      // Step 2: Create and save new student
      const newStudent = new this.studentModel(createStudentDto);
      const savedStudent = await newStudent.save();
      return this.toResponseDto(savedStudent);
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof ConflictException) {
        throw error;
      }
      // Handle unexpected errors
      throw new Error('Failed to create student');
    }
  }

  /**
   * Retrieves all students from the database
   *
   * @returns Promise<StudentResponseDto[]> - Array of all students with MongoDB _id
   */
  async findAll(): Promise<StudentResponseDto[]> {
    const students = await this.studentModel.find().exec();
    return students.map((student) => this.toResponseDto(student));
  }

  /**
   * Finds a specific student by their ID
   *
   * @param id - MongoDB ObjectId of the student
   * @returns Promise<StudentResponseDto> - The found student with MongoDB _id
   * @throws NotFoundException - If student with given ID doesn't exist
   */
  async findOne(id: string): Promise<StudentResponseDto> {
    const student = await this.studentModel.findById(id).exec();

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return this.toResponseDto(student);
  }

  async findByCode(code: string): Promise<StudentResponseDto> {
    const student = await this.studentModel.findOne({ code }).exec();

    if (!student) {
      throw new NotFoundException(`Student with code ${code} not found`);
    }

    return this.toResponseDto(student);
  }

  /**
   * Updates an existing student's information
   *
   * Uses MongoDB's findByIdAndUpdate with { new: true } option
   * to return the updated document instead of the original.
   *
   * @param id - MongoDB ObjectId of the student to update
   * @param updateStudentDto - Partial student data with updates
   * @returns Promise<StudentResponseDto> - The updated student with MongoDB _id
   * @throws NotFoundException - If student with given ID doesn't exist
   */
  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    const updatedStudent = await this.studentModel
      .findByIdAndUpdate(id, updateStudentDto, { new: true })
      .exec();

    if (!updatedStudent) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return this.toResponseDto(updatedStudent);
  }

  /**
   * Removes a student from the database
   *
   * Performs a hard delete - the student record is permanently removed.
   * Consider implementing soft delete for audit purposes in production.
   *
   * @param id - MongoDB ObjectId of the student to delete
   * @returns Promise<void> - No return value on success
   * @throws NotFoundException - If student with given ID doesn't exist
   */
  async remove(id: string): Promise<void> {
    const result = await this.studentModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
  }

  async getStudentSchedule(studentCode: string) {
    return await this.studentScheduleService.getCurrentSchedule(studentCode);
  }

  async getStudentAcademicHistory(studentCode: string) {
    return await this.studentScheduleService.getStudentAcademicHistory(
      studentCode,
    );
  }

  /**
   * Convert Student document to StudentResponseDto
   *
   * Transforms database entity to response DTO format.
   * Includes MongoDB _id as string for client-side operations.
   */
  private toResponseDto(student: StudentDocument): StudentResponseDto {
    return {
      _id: student._id?.toString(),
      code: student.code,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: student.fullName,
      programId: student.programId,
      currentSemester: student.currentSemester,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}
