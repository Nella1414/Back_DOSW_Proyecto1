import { IsOptional, IsString, IsNumber, IsEnum, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { WaitlistStatus } from '../entities/waitlist.entity';

export class QueryWaitlistDto {
  @IsOptional()
  @IsMongoId()
  groupId?: string;

  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsOptional()
  @IsMongoId()
  academicPeriodId?: string;

  @IsOptional()
  @IsEnum(WaitlistStatus)
  status?: WaitlistStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPriority?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
