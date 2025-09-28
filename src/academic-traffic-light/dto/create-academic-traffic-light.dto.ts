import { IsString, IsNotEmpty, IsNumber, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { AcademicStanding, TrafficLightColor } from '../entities/academic-traffic-light.entity';

export class CreateAcademicTrafficLightDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  periodId: string;

  @IsNumber()
  @Min(0)
  totalCreditsAttempted: number;

  @IsNumber()
  @Min(0)
  totalCreditsEarned: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  currentGPA: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  cumulativeGPA: number;

  @IsEnum(AcademicStanding)
  academicStanding: AcademicStanding;

  @IsEnum(TrafficLightColor)
  trafficLightColor: TrafficLightColor;

  @IsString()
  @IsOptional()
  observations?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  passedCourses?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  failedCourses?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  enrolledCourses?: number;
}
