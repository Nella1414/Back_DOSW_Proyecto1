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
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Course DTO
 *
 * Data Transfer Object for creating new courses in the academic catalog.
 * This DTO validates and structures the input data required to establish
 * a new course with comprehensive metadata, prerequisites, and academic details.
 *
 * ! IMPORTANTE: Los cursos son fundamentales para el sistema académico
 * ! y deben ser creados con validación exhaustiva
 */
export class CreateCourseDto {
  /**
   * Unique course identification code
   *
   * * Debe ser único en todo el sistema académico
   * ? Formato sugerido: [AREA][LEVEL] (ej: CS101, MATH201)
   */
  @ApiProperty({
    description: 'Unique course identification code',
    example: 'CS101',
    minLength: 3,
    maxLength: 15,
    pattern: '^[A-Z]{2,4}[0-9]{3,4}$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 15)
  @Matches(/^[A-Z]{2,4}[0-9]{3,4}$/, {
    message:
      'Course code must follow format: 2-4 letters + 3-4 numbers (e.g., CS101, MATH1001)',
  })
  code: string;

  /**
   * Complete course name
   *
   * * Nombre descriptivo y completo del curso
   */
  @ApiProperty({
    description: 'Complete course name',
    example: 'Introduction to Computer Science',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  name: string;

  /**
   * Detailed course description
   *
   * * Descripción completa del contenido y objetivos del curso
   */
  @ApiProperty({
    description:
      'Detailed course description including objectives and content overview',
    example:
      'Fundamental concepts of computer science including programming principles, data structures, and problem-solving techniques.',
    minLength: 20,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(20, 1000)
  description: string;

  /**
   * Number of academic credits
   *
   * * Número de créditos académicos del curso
   * ! Debe estar entre 1 y 10 créditos
   */
  @ApiProperty({
    description: 'Number of academic credits for this course',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  credits: number;

  /**
   * Course prerequisites
   *
   * ? Lista de códigos de cursos que son prerrequisitos
   * * Opcional - algunos cursos no tienen prerrequisitos
   */
  @ApiProperty({
    description:
      'List of prerequisite course codes that must be completed before taking this course',
    example: ['MATH101', 'CS100'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  prerequisites?: string[];

  /**
   * Whether the course is currently active
   *
   * * Controla si el curso está disponible para matrícula
   * * Por defecto: true
   */
  @ApiProperty({
    description:
      'Whether the course is currently active and available for enrollment',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /**
   * Academic level or year
   *
   * ? Nivel académico del curso (1-4 para pregrado, 5+ para posgrado)
   */
  @ApiProperty({
    description:
      'Academic level or year of the course (1-4 for undergraduate, 5+ for graduate)',
    example: 1,
    minimum: 1,
    maximum: 8,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(8)
  academicLevel?: number;

  /**
   * Course category or area
   *
   * ? Categoría o área académica del curso
   */
  @ApiProperty({
    description:
      'Course category or academic area (e.g., "Core", "Elective", "Laboratory")',
    example: 'Core',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  category?: string;

  /**
   * Learning objectives
   *
   * ? Objetivos de aprendizaje específicos del curso
   */
  @ApiProperty({
    description: 'Specific learning objectives for the course',
    example: [
      'Understand basic programming concepts',
      'Apply problem-solving techniques',
      'Develop algorithmic thinking',
    ],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  learningObjectives?: string[];
}
