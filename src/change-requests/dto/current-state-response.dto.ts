import { RequestState } from '../entities/change-request.entity';
import { CourseInfoDto } from './change-request-response.dto';

export class CurrentStateInfoDto {
  state: RequestState;
  stateName: string;
  stateDescription: string;
  stateColor: string;
  timestamp: Date;
  changedBy?: string;
  changedByName?: string;
  version: number;
}

export class LastUpdateInfoDto {
  updatedAt: Date;
  updatedBy?: string;
  updatedByName?: string;
  observations?: string;
}

export class AvailableActionDto {
  action: string;
  toState: string;
  label: string;
  description?: string;
  requiresReason: boolean;
  requiredPermissions: string[];
  buttonType: 'primary' | 'success' | 'danger' | 'warning' | 'info';
}

export class RequestBasicInfoDto {
  id: string;
  radicado: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  programName: string;
  periodCode: string;
  periodName: string;
  priority: number;
  exceptional: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolutionReason?: string;
  dueAt?: Date;
}

export class CourseChangeInfoDto {
  sourceCourse: CourseInfoDto;
  targetCourse: CourseInfoDto;
  hasScheduleConflict: boolean;
  conflictDetails?: string[];
}

export class RequestCurrentStateResponseDto {
  // Información básica de la solicitud
  basicInfo: RequestBasicInfoDto;

  // Estado actual completo
  currentState: CurrentStateInfoDto;

  // Información de las materias
  courseChange: CourseChangeInfoDto;

  // Última actualización
  lastUpdate: LastUpdateInfoDto;

  // Acciones disponibles para el usuario actual
  availableActions: AvailableActionDto[];

  // Métricas rápidas
  metrics: {
    daysInCurrentState: number;
    daysSinceCreation: number;
    hasTransitions: boolean;
    totalStateChanges: number;
  };

  // Flags de estado
  flags: {
    canBeModified: boolean;
    isResolved: boolean;
    isPending: boolean;
    requiresAttention: boolean;
  };
}