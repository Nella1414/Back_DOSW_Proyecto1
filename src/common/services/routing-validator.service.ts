import { Injectable, Logger } from '@nestjs/common';

export interface ValidationResult {
  isValid: boolean;
  assignedProgramId: string;
  fallbackUsed: boolean;
  reason?: string;
}

@Injectable()
export class RoutingValidatorService {
  private readonly logger = new Logger(RoutingValidatorService.name);
  private readonly DEFAULT_PROGRAM = 'PROG-ADMIN'; // Programa por defecto

  /**
   * Valida y garantiza que el programa asignado sea válido
   */
  async validateAndEnsureProgram(
    proposedProgramId: string,
    requestId: string,
    context: Record<string, any>
  ): Promise<ValidationResult> {
    
    // Validar que el programa existe y está activo
    const isValidProgram = await this.validateProgramExists(proposedProgramId);
    const isActiveProgram = await this.validateProgramActive(proposedProgramId);

    if (isValidProgram && isActiveProgram) {
      return {
        isValid: true,
        assignedProgramId: proposedProgramId,
        fallbackUsed: false
      };
    }

    // Aplicar fallback si el programa no es válido
    const fallbackResult = await this.applyFallback(
      proposedProgramId,
      requestId,
      context,
      !isValidProgram ? 'PROGRAM_NOT_EXISTS' : 'PROGRAM_INACTIVE'
    );

    return fallbackResult;
  }

  /**
   * Verifica que el programa existe en el sistema
   */
  private async validateProgramExists(programId: string): Promise<boolean> {
    // Simulación - en implementación real consultar base de datos
    const validPrograms = [
      'PROG-CS', 'PROG-ING', 'PROG-MAT', 
      'PROG-FIS', 'PROG-ADMIN', 'PROG-DEFAULT'
    ];
    
    return validPrograms.includes(programId);
  }

  /**
   * Verifica que el programa está activo
   */
  private async validateProgramActive(programId: string): Promise<boolean> {
    // Simulación - en implementación real consultar base de datos
    // Simular que algunos programas están inactivos
    const inactivePrograms = ['PROG-INACTIVE', 'PROG-SUSPENDED'];
    
    return !inactivePrograms.includes(programId);
  }

  /**
   * Aplica fallback cuando el ruteo falla
   */
  private async applyFallback(
    originalProgramId: string,
    requestId: string,
    context: Record<string, any>,
    reason: string
  ): Promise<ValidationResult> {
    
    // Loggear el caso que requiere fallback
    this.logger.warn(`Fallback aplicado para solicitud ${requestId}`, {
      originalProgramId,
      reason,
      context,
      fallbackProgram: this.DEFAULT_PROGRAM
    });

    // Verificar que el programa por defecto es válido
    const isDefaultValid = await this.validateProgramExists(this.DEFAULT_PROGRAM);
    const isDefaultActive = await this.validateProgramActive(this.DEFAULT_PROGRAM);

    if (!isDefaultValid || !isDefaultActive) {
      // Caso crítico - programa por defecto no válido
      this.logger.error(`Programa por defecto ${this.DEFAULT_PROGRAM} no es válido`, {
        requestId,
        originalProgramId,
        defaultExists: isDefaultValid,
        defaultActive: isDefaultActive
      });

      // Usar programa de emergencia
      return {
        isValid: false,
        assignedProgramId: 'PROG-EMERGENCY',
        fallbackUsed: true,
        reason: `Programa original ${originalProgramId} inválido, programa por defecto también inválido`
      };
    }

    return {
      isValid: true,
      assignedProgramId: this.DEFAULT_PROGRAM,
      fallbackUsed: true,
      reason: `Programa original ${originalProgramId} inválido (${reason}), usando programa por defecto`
    };
  }

  /**
   * Obtiene el programa por defecto del sistema
   */
  getDefaultProgram(): string {
    return this.DEFAULT_PROGRAM;
  }

  /**
   * Verifica si un programa requiere notificación a administradores
   */
  shouldNotifyAdmins(validationResult: ValidationResult): boolean {
    return validationResult.fallbackUsed || !validationResult.isValid;
  }

  /**
   * Obtiene estadísticas de validación
   */
  getValidationStats(): Record<string, any> {
    return {
      defaultProgram: this.DEFAULT_PROGRAM,
      emergencyProgram: 'PROG-EMERGENCY',
      validationRules: [
        'Programa debe existir en el sistema',
        'Programa debe estar activo',
        'Si falla, usar programa por defecto',
        'Si programa por defecto falla, usar programa de emergencia'
      ],
      fallbackReasons: [
        'PROGRAM_NOT_EXISTS: Programa no existe',
        'PROGRAM_INACTIVE: Programa inactivo',
        'DEFAULT_INVALID: Programa por defecto inválido'
      ]
    };
  }
}