import { IsOptional, IsEnum, IsMongoId, IsNumber, IsBoolean, IsDateString, IsString } from 'class-validator';
import { EnrollmentStatus } from '../entities/enrollment.entity';

/**
 * DTO to filter and paginate registrations
 */
export class QueryEnrollmentsDto {
  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsOptional()
  @IsMongoId()
  groupId?: string;

  @IsOptional()
  @IsMongoId()
  academicPeriodId?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  @IsNumber()
  minGrade?: number;

  @IsOptional()
  @IsNumber()
  maxGrade?: number;

  @IsOptional()
  @IsBoolean()
  isSpecialEnrollment?: boolean;

  @IsOptional()
  @IsDateString()
  enrolledAfter?: string;

  @IsOptional()
  @IsDateString()
  enrolledBefore?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
