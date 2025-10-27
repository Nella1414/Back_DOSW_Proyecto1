import { IsString, IsOptional, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestState } from '../entities/change-request.entity';

// ✅ DTO CORRECTO con decoradores
export class CreateChangeRequestDto {
  @ApiProperty({
    description: 'ID del grupo origen (actual)',
    example: '68dc69c6bffc23f7995e3f50',
  })
  @IsString()
  @IsNotEmpty()
  sourceGroupId: string;

  @ApiProperty({
    description: 'ID del grupo destino (al que se quiere cambiar)',
    example: '68dc69c6bffc23f7995e3f51',
  })
  @IsString()
  @IsNotEmpty()
  targetGroupId: string;

  @ApiProperty({
    description: 'Razón del cambio de grupo',
    example: 'Conflicto de horario con otra materia',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Prioridad de la solicitud (1-10)',
    example: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Solicitud urgente',
  })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class ApproveChangeRequestDto {
  @ApiPropertyOptional({
    description: 'Observaciones de la aprobación',
  })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({
    description: 'Razón de la resolución',
  })
  @IsOptional()
  @IsString()
  resolutionReason?: string;
}

export class RejectChangeRequestDto {
  @ApiProperty({
    description: 'Razón del rechazo (obligatorio)',
  })
  @IsString()
  @IsNotEmpty()
  resolutionReason: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
  })
  @IsOptional()
  @IsString()
  observations?: string;
}

// DTOs de respuesta (sin decoradores de validación)
export class ChangeRequestResponseDto {
  id: string;
  radicado: string;
  studentId: string;
  studentName: string;
  programName: string;
  periodCode: string;
  sourceCourse: CourseInfoDto;
  targetCourse: CourseInfoDto;
  state: RequestState;
  priority: number;
  observations?: string;
  exceptional: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolutionReason?: string;
}

export class CourseInfoDto {
  courseId: string;
  courseCode: string;
  courseName: string;
  groupNumber: string;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
}