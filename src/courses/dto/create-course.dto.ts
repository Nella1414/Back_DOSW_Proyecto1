import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  Max,
  Length,
  Matches,
  IsIn,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Create Course DTO
 *
 * Data Transfer Object for creating new courses in the academic system.
 * Includes comprehensive business validations and formatting rules.
 */
export class CreateCourseDto {
  /**
   * Unique course code.
   * Format: Uppercase letters followed by optional numbers.
   * Examples: "CS101", "MATH", "ENG2000"
   *
   * @example "CS101"
   */
  @ApiProperty({
    description: 'Unique course code (uppercase letters and numbers)',
    example: 'CS101',
    minLength: 2,
    maxLength: 10,
    pattern: '^[A-Z][A-Z0-9]*$',
  })
  @IsNotEmpty({ message: 'Course code is required' })
  @IsString({ message: 'Course code must be a string' })
  @Length(2, 10, { message: 'Course code must be between 2 and 10 characters' })
  @Matches(/^[A-Z][A-Z0-9]*$/, {
    message: 'Course code must start with an uppercase letter and contain only uppercase letters and numbers',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  code: string;

  /**
   * Full name of the course.
   *
   * @example "Introduction to Computer Science"
   */
  @ApiProperty({
    description: 'Full descriptive name of the course',
    example: 'Introduction to Computer Science',
    minLength: 3,
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Course name is required' })
  @IsString({ message: 'Course name must be a string' })
  @Length(3, 200, { message: 'Course name must be between 3 and 200 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  /**
   * Number of academic credits.
   * Valid range: 1-10.
   *
   * @example 3
   */
  @ApiProperty({
    description: 'Number of academic credits',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNotEmpty({ message: 'Credits are required' })
  @IsNumber({}, { message: 'Credits must be a number' })
  @Min(1, { message: 'Minimum credits is 1' })
  @Max(10, { message: 'Maximum credits is 10' })
  credits: number;

  /**
   * Academic level.
   * 1-4: Undergraduate
   * 5-8: Graduate
   *
   * @example 1
   */
  @ApiProperty({
    description: 'Academic level (1-4 undergraduate, 5-8 graduate)',
    example: 1,
    minimum: 1,
    maximum: 8,
  })
  @IsNotEmpty({ message: 'Academic level is required' })
  @IsNumber({}, { message: 'Academic level must be a number' })
  @Min(1, { message: 'Minimum academic level is 1' })
  @Max(8, { message: 'Maximum academic level is 8' })
  academicLevel: number;

  /**
   * Course category.
   * Allowed values: Core, Elective, Laboratory, Seminar, Workshop, Thesis.
   *
   * @example "Core"
   */
  @ApiProperty({
    description: 'Course category',
    example: 'Core',
    enum: ['Core', 'Elective', 'Laboratory', 'Seminar', 'Workshop', 'Thesis'],
  })
  @IsNotEmpty({ message: 'Category is required' })
  @IsString({ message: 'Category must be a string' })
  @IsIn(['Core', 'Elective', 'Laboratory', 'Seminar', 'Workshop', 'Thesis'], {
    message: 'Invalid category. Allowed values: Core, Elective, Laboratory, Seminar, Workshop, Thesis',
  })
  category: string;

  /**
   * List of prerequisite course codes.
   * Must be valid course codes.
   *
   * @example ["CS100", "MATH101"]
   */
  @ApiProperty({
    description: 'List of prerequisite course codes',
    example: ['CS100', 'MATH101'],
    required: false,
    type: [String],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Prerequisites must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 prerequisites allowed' })
  @IsString({ each: true, message: 'Each prerequisite must be a string' })
  @Matches(/^[A-Z][A-Z0-9]*$/, {
    each: true,
    message: 'Each prerequisite code must be valid (uppercase letters and numbers)',
  })
  @Transform(({ value }) => 
    Array.isArray(value) 
      ? value.map(v => v?.toUpperCase().trim()).filter(Boolean)
      : []
  )
  prerequisites?: string[];

  /**
   * Indicates if the course is active.
   * true: Active and available
   * false: Inactive or discontinued
   *
   * @example true
   */
  @ApiProperty({
    description: 'Indicates if the course is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active status must be true or false' })
  active?: boolean;

  /**
   * Detailed course description (optional).
   * Includes content, objectives, and additional details.
   *
   * @example "This course introduces fundamental concepts of computer science..."
   */
  @ApiProperty({
    description: 'Detailed course description',
    example: 'This course introduces fundamental concepts of computer science including algorithms, data structures, and programming paradigms.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(0, 1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;
}