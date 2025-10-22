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