import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Program,
  ProgramDocument,
} from '../../programs/entities/program.entity';

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

  constructor(
    @InjectModel(Program.name)
    private programModel: Model<ProgramDocument>,
  ) {}

  /**
   * Valida y garantiza que el programa asignado sea válido
   */
  async validateAndEnsureProgram(
    proposedProgramId: string,
    requestId: string,
    context: Record<string, any>,
  ): Promise<ValidationResult> {
    try {
      this.logger.debug(
        `Validando programa ${proposedProgramId} para solicitud ${requestId}`,
      );

      // Validar que el programa existe y está activo
      const isValidProgram =
        await this.validateProgramExists(proposedProgramId);
      const isActiveProgram =
        await this.validateProgramActive(proposedProgramId);

      if (isValidProgram && isActiveProgram) {
        this.logger.log(
          `Programa ${proposedProgramId} validado exitosamente para solicitud ${requestId}`,
        );
        return {
          isValid: true,
          assignedProgramId: proposedProgramId,
          fallbackUsed: false,
        };
      }

      // Aplicar fallback si el programa no es válido
      this.logger.warn(
        `Programa ${proposedProgramId} no es válido para solicitud ${requestId}, aplicando fallback`,
      );
      const fallbackResult = await this.applyFallback(
        proposedProgramId,
        requestId,
        context,
        !isValidProgram ? 'PROGRAM_NOT_EXISTS' : 'PROGRAM_INACTIVE',
      );

      return fallbackResult;
    } catch (error) {
      this.logger.error(
        `Error crítico validando programa ${proposedProgramId} para solicitud ${requestId}: ${error.message}`,
        error.stack,
      );

      // En caso de error crítico, retornar programa de emergencia
      return {
        isValid: false,
        assignedProgramId: 'PROG-EMERGENCY',
        fallbackUsed: true,
        reason: `Error en validación: ${error.message}`,
      };
    }
  }

  /**
   * Verifica que el programa existe en el sistema
   */
  private async validateProgramExists(programId: string): Promise<boolean> {
    try {
      const program = await this.programModel
        .findOne({
          $or: [{ _id: programId }, { code: programId }],
        })
        .exec();

      const exists = !!program;

      if (!exists) {
        this.logger.debug(`Programa ${programId} no existe en el sistema`);
      }

      return exists;
    } catch (error) {
      this.logger.error(
        `Error verificando existencia de programa ${programId}: ${error.message}`,
        error.stack,
      );
      // En caso de error, asumir que no existe por seguridad
      return false;
    }
  }

  /**
   * Verifica que el programa está activo
   */
  private async validateProgramActive(programId: string): Promise<boolean> {
    try {
      const program = await this.programModel
        .findOne({
          $or: [{ _id: programId }, { code: programId }],
          isActive: true,
        })
        .exec();

      const isActive = !!program;

      if (!isActive) {
        this.logger.debug(`Programa ${programId} está inactivo`);
      }

      return isActive;
    } catch (error) {
      this.logger.error(
        `Error verificando estado de programa ${programId}: ${error.message}`,
        error.stack,
      );
      // En caso de error, asumir que no está activo por seguridad
      return false;
    }
  }

  /**
   * Aplica fallback cuando el ruteo falla
   */
  private async applyFallback(
    originalProgramId: string,
    requestId: string,
    context: Record<string, any>,
    reason: string,
  ): Promise<ValidationResult> {
    try {
      // Loggear el caso que requiere fallback
      this.logger.warn(`Fallback aplicado para solicitud ${requestId}`, {
        originalProgramId,
        reason,
        context,
        fallbackProgram: this.DEFAULT_PROGRAM,
      });

      // Verificar que el programa por defecto es válido
      const isDefaultValid = await this.validateProgramExists(
        this.DEFAULT_PROGRAM,
      );
      const isDefaultActive = await this.validateProgramActive(
        this.DEFAULT_PROGRAM,
      );

      if (!isDefaultValid || !isDefaultActive) {
        // Caso crítico - programa por defecto no válido
        this.logger.error(
          `Programa por defecto ${this.DEFAULT_PROGRAM} no es válido`,
          {
            requestId,
            originalProgramId,
            defaultExists: isDefaultValid,
            defaultActive: isDefaultActive,
          },
        );

        // Usar programa de emergencia
        return {
          isValid: false,
          assignedProgramId: 'PROG-EMERGENCY',
          fallbackUsed: true,
          reason: `Programa original ${originalProgramId} inválido, programa por defecto también inválido`,
        };
      }

      this.logger.log(
        `Fallback exitoso: asignado programa por defecto ${this.DEFAULT_PROGRAM} para solicitud ${requestId}`,
      );

      return {
        isValid: true,
        assignedProgramId: this.DEFAULT_PROGRAM,
        fallbackUsed: true,
        reason: `Programa original ${originalProgramId} inválido (${reason}), usando programa por defecto`,
      };
    } catch (error) {
      this.logger.error(
        `Error crítico en applyFallback para solicitud ${requestId}: ${error.message}`,
        error.stack,
      );

      // Retornar programa de emergencia en caso de error
      return {
        isValid: false,
        assignedProgramId: 'PROG-EMERGENCY',
        fallbackUsed: true,
        reason: `Error en fallback: ${error.message}`,
      };
    }
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
        'Si programa por defecto falla, usar programa de emergencia',
      ],
      fallbackReasons: [
        'PROGRAM_NOT_EXISTS: Programa no existe',
        'PROGRAM_INACTIVE: Programa inactivo',
        'DEFAULT_INVALID: Programa por defecto inválido',
      ],
    };
  }
}
