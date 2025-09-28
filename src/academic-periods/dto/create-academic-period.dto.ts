import { IsString, IsNotEmpty, IsDate, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAcademicPeriodDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  allowChangeRequests?: boolean;

  @IsBoolean()
  @IsOptional()
  isEnrollmentOpen?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}