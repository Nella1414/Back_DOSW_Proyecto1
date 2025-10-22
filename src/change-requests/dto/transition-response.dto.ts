export class AvailableTransitionDto {
  toState: string;
  description?: string;
  requiresReason?: boolean;
  requiredPermissions?: string[];
}

export class TransitionValidationDto {
  isValid: boolean;
  error?: string;
  requiresReason?: boolean;
  requiredPermissions?: string[];
}

export class StateTransitionRequestDto {
  toState: string;
  reason?: string;
  observations?: string;
}

export class RequestAdditionalInfoDto {
  reason: string;
  observations?: string;
}

export class StateChangeResponseDto {
  success: boolean;
  previousState: string;
  newState: string;
  version: number;
  changedAt: Date;
  changedBy?: string;
}

export class AvailableActionsResponseDto {
  currentState: string;
  version: number;
  availableTransitions: AvailableTransitionDto[];
}