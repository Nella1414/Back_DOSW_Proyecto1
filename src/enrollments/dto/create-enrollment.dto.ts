import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus = EnrollmentStatus.ENROLLED;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  grade?: number;
}
