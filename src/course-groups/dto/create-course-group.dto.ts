import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateCourseGroupDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  groupNumber: string;

  @IsString()
  @IsNotEmpty()
  periodId: string;

  @IsNumber()
  @Min(1)
  maxStudents: number;

  @IsString()
  @IsOptional()
  professorId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  classroom?: string;

  @IsString()
  @IsOptional()
  observations?: string;
}
