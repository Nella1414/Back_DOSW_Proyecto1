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
  IsInt,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidName } from '../../common/validators/custom-validators';

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
    description: 'Código único de identificación del curso',
    example: 'CS101',
    minLength: 5,
    maxLength: 10,
    pattern: '^[A-Z]{2,4}[0-9]{3,4}$',
  })
  @IsString({ message: 'El código del curso debe ser texto' })
  @IsNotEmpty({ message: 'El código del curso es obligatorio' })
  @Length(5, 10, { message: 'El código debe tener entre 5 y 10 caracteres' })
  @Matches(/^[A-Z]{2,4}[0-9]{3,4}$/, {
    message: 'El código debe seguir el formato: 2-4 letras + 3-4 números (ej: CS101, MATH1001)',
  })
  code: string;

  /**
   * Complete course name
   *
   * * Nombre descriptivo y completo del curso
   */
  @ApiProperty({
    description: 'Nombre completo del curso',
    example: 'Introducción a las Ciencias de la Computación',
    minLength: 5,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre del curso debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del curso es obligatorio' })
  @Length(5, 100, { message: 'El nombre debe tener entre 5 y 100 caracteres' })
  @IsValidName({ message: 'El nombre solo puede contener letras, números, espacios y acentos' })
  name: string;

  /**
   * Detailed course description
   *
   * * Descripción completa del contenido y objetivos del curso
   */
  @ApiProperty({
    description: 'Descripción detallada del curso incluyendo objetivos y contenido',
    example: 'Conceptos fundamentales de ciencias de la computación incluyendo principios de programación, estructuras de datos y técnicas de resolución de problemas.',
    minLength: 20,
    maxLength: 1000,
  })
  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción del curso es obligatoria' })
  @Length(20, 1000, { message: 'La descripción debe tener entre 20 y 1000 caracteres' })
  description: string;

  /**
   * Number of academic credits
   *
   * * Número de créditos académicos del curso
   * ! Debe estar entre 1 y 10 créditos
   */
  @ApiProperty({
    description: 'Número de créditos académicos del curso',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsInt({ message: 'Los créditos deben ser un número entero' })
  @Min(1, { message: 'El curso debe tener al menos 1 crédito' })
  @Max(10, { message: 'El curso no puede tener más de 10 créditos' })
  credits: number;

  /**
   * Course prerequisites
   *
   * ? Lista de códigos de cursos que son prerrequisitos
   * * Opcional - algunos cursos no tienen prerrequisitos
   */
  @ApiProperty({
    description: 'Lista de códigos de cursos prerrequisitos que deben completarse antes de tomar este curso',
    example: ['MATH101', 'CS100'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Los prerrequisitos deben ser una lista' })
  @ArrayMaxSize(10, { message: 'No puede tener más de 10 prerrequisitos' })
  @IsString({ each: true, message: 'Cada prerrequisito debe ser texto' })
  @Matches(/^[A-Z]{2,4}[0-9]{3,4}$/, { each: true, message: 'Cada prerrequisito debe tener formato válido (ej: CS101)' })
  prerequisites?: string[];

  /**
   * Whether the course is currently active
   *
   * * Controla si el curso está disponible para matrícula
   * * Por defecto: true
   */
  @ApiProperty({
    description: 'Si el curso está activo y disponible para matrícula',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  isActive?: boolean;

  /**
   * Academic level or year
   *
   * ? Nivel académico del curso (1-4 para pregrado, 5+ para posgrado)
   */
  @ApiProperty({
    description: 'Nivel académico del curso (1-4 pregrado, 5-8 posgrado)',
    example: 1,
    minimum: 1,
    maximum: 8,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El nivel académico debe ser un número entero' })
  @Min(1, { message: 'El nivel académico debe ser mínimo 1' })
  @Max(8, { message: 'El nivel académico no puede ser mayor a 8' })
  academicLevel?: number;

  /**
   * Course category or area
   *
   * ? Categoría o área académica del curso
   */
  @ApiProperty({
    description: 'Categoría o área académica del curso (ej: "Núcleo", "Electiva", "Laboratorio")',
    example: 'Núcleo',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La categoría debe ser texto' })
  @Length(2, 50, { message: 'La categoría debe tener entre 2 y 50 caracteres' })
  @IsValidName({ message: 'La categoría solo puede contener letras, espacios y acentos' })
  category?: string;

  /**
   * Learning objectives
   *
   * ? Objetivos de aprendizaje específicos del curso
   */
  @ApiProperty({
    description: 'Objetivos de aprendizaje específicos del curso',
    example: [
      'Comprender conceptos básicos de programación',
      'Aplicar técnicas de resolución de problemas',
      'Desarrollar pensamiento algorítmico',
    ],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Los objetivos de aprendizaje deben ser una lista' })
  @ArrayMinSize(1, { message: 'Debe tener al menos 1 objetivo de aprendizaje' })
  @ArrayMaxSize(10, { message: 'No puede tener más de 10 objetivos de aprendizaje' })
  @IsString({ each: true, message: 'Cada objetivo debe ser texto' })
  @Length(10, 200, { each: true, message: 'Cada objetivo debe tener entre 10 y 200 caracteres' })
  learningObjectives?: string[];
}
