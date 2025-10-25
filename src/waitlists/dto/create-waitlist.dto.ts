import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Create Waitlist DTO
 *
 * Data Transfer Object para agregar estudiantes a lista de espera.
 */
export class CreateWaitlistDto {
  /**
   * ID del grupo de curso
   * 
   * MongoDB ObjectId del grupo que está lleno
   * 
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: 'ID del grupo de curso (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'El ID del grupo es obligatorio' })
  @IsMongoId({ message: 'El ID del grupo debe ser un ObjectId válido' })
  groupId: string;

  /**
   * ID del estudiante
   * 
   * MongoDB ObjectId del estudiante que desea inscribirse
   * 
   * @example "507f1f77bcf86cd799439012"
   */
  @ApiProperty({
    description: 'ID del estudiante (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsNotEmpty({ message: 'El ID del estudiante es obligatorio' })
  @IsMongoId({ message: 'El ID del estudiante debe ser un ObjectId válido' })
  studentId: string;

  /**
   * ID del periodo académico
   * 
   * MongoDB ObjectId del periodo académico
   * 
   * @example "507f1f77bcf86cd799439013"
   */
  @ApiProperty({
    description: 'ID del periodo académico (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439013',
  })
  @IsNotEmpty({ message: 'El ID del periodo académico es obligatorio' })
  @IsMongoId({ message: 'El ID del periodo debe ser un ObjectId válido' })
  academicPeriodId: string;

  /**
   * Nivel de prioridad
   * 
   * Para casos especiales o estudiantes con prioridad
   * 0 = prioridad normal, 10 = máxima prioridad
   * 
   * @example 0
   */
  @ApiProperty({
    description: 'Nivel de prioridad del estudiante (0-10)',
    example: 0,
    minimum: 0,
    maximum: 10,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La prioridad debe ser un número' })
  @Min(0, { message: 'La prioridad mínima es 0' })
  @Max(10, { message: 'La prioridad máxima es 10' })
  priority?: number;

  /**
   * Notas adicionales
   * 
   * Información adicional sobre la solicitud de lista de espera
   * 
   * @example "Estudiante con necesidad de graduación urgente"
   */
  @ApiProperty({
    description: 'Notas adicionales sobre la solicitud',
    example: 'Estudiante en último semestre',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @Length(0, 1000, { 
    message: 'Las notas no pueden exceder 1000 caracteres' 
  })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}