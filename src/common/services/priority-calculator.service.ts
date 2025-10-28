import { Injectable, Logger } from '@nestjs/common';

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface PriorityContext {
  userId: string;
  sourceSubjectId: string;
  targetSubjectId: string;
  studentSemester?: number;
  isSourceMandatory?: boolean;
  isTargetMandatory?: boolean;
  isAddDropPeriod?: boolean;
  requestDate?: Date;
}

export interface AddDropPeriodConfig {
  startDay: number;
  endDay: number;
}

@Injectable()
export class PriorityCalculatorService {
  private readonly logger = new Logger(PriorityCalculatorService.name);

  // Configuración de periodos add/drop
  // Primer periodo: días 15-29 (inicio del primer semestre)
  // Segundo periodo: días 195-209 (inicio del segundo semestre)
  private readonly addDropPeriods: AddDropPeriodConfig[] = [
    { startDay: 15, endDay: 29 },
    { startDay: 195, endDay: 209 },
  ];

  /**
   * Calcula prioridad basada en criterios objetivos
   */
  calculatePriority(context: PriorityContext): Priority {
    try {
      this.logger.debug(`Calculando prioridad para usuario ${context.userId}`);

      let priority = Priority.NORMAL; // Por defecto

      // Criterio 1: Estudiantes próximos a graduar (último semestre)
      if (context.studentSemester && context.studentSemester >= 10) {
        priority = Priority.HIGH;
        this.logger.debug(
          `Prioridad aumentada a HIGH: estudiante en semestre ${context.studentSemester}`,
        );
      }

      // Criterio 2: Materias obligatorias tienen mayor prioridad
      if (context.isTargetMandatory) {
        priority = Priority.HIGH;
        this.logger.debug('Prioridad aumentada a HIGH: materia obligatoria');
      }

      // Criterio 3: Periodo add/drop tiene menor prioridad
      if (context.isAddDropPeriod) {
        priority = Priority.LOW;
        this.logger.debug('Prioridad reducida a LOW: periodo add/drop activo');
      }

      // Criterio 4: Casos urgentes (combinación de factores)
      if (
        context.studentSemester &&
        context.studentSemester >= 10 &&
        context.isTargetMandatory
      ) {
        priority = Priority.URGENT;
        this.logger.warn(
          `Prioridad URGENTE: estudiante en semestre ${context.studentSemester} con materia obligatoria`,
        );
      }

      this.logger.log(
        `Prioridad calculada: ${priority} para usuario ${context.userId}`,
      );
      return priority;
    } catch (error) {
      this.logger.error(
        `Error calculando prioridad para usuario ${context.userId}: ${error.message}`,
        error.stack,
      );
      // En caso de error, retornar prioridad normal por seguridad
      this.logger.warn('Retornando prioridad NORMAL por error en cálculo');
      return Priority.NORMAL;
    }
  }

  /**
   * Obtiene descripción de la prioridad calculada
   */
  getPriorityDescription(priority: Priority): string {
    const descriptions = {
      [Priority.LOW]: 'Prioridad baja - Periodo add/drop o electivas',
      [Priority.NORMAL]: 'Prioridad normal - Solicitud estándar',
      [Priority.HIGH]:
        'Prioridad alta - Materia obligatoria o estudiante avanzado',
      [Priority.URGENT]:
        'Prioridad urgente - Estudiante próximo a graduar con materia obligatoria',
    };

    return descriptions[priority];
  }

  /**
   * Obtiene peso numérico para ordenamiento
   */
  getPriorityWeight(priority: Priority): number {
    const weights = {
      [Priority.LOW]: 1,
      [Priority.NORMAL]: 2,
      [Priority.HIGH]: 3,
      [Priority.URGENT]: 4,
    };

    return weights[priority];
  }

  /**
   * Determina si es periodo add/drop basado en configuración
   */
  isAddDropPeriod(date: Date = new Date()): boolean {
    try {
      const dayOfYear = this.calculateDayOfYear(date);

      this.logger.debug(
        `Verificando si día ${dayOfYear} del año ${date.getFullYear()} está en periodo add/drop`,
      );

      // Verificar contra todos los periodos configurados
      const isInPeriod = this.addDropPeriods.some(
        (period) => dayOfYear >= period.startDay && dayOfYear <= period.endDay,
      );

      if (isInPeriod) {
        this.logger.debug(
          `Fecha ${date.toISOString()} está en periodo add/drop`,
        );
      }

      return isInPeriod;
    } catch (error) {
      this.logger.error(
        `Error verificando periodo add/drop: ${error.message}`,
        error.stack,
      );
      // En caso de error, asumir que NO es periodo add/drop
      return false;
    }
  }

  /**
   * Calcula el día del año (1-366)
   */
  private calculateDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Configura periodos add/drop personalizados
   */
  setAddDropPeriods(periods: AddDropPeriodConfig[]): void {
    try {
      // Validar que los periodos sean válidos
      for (const period of periods) {
        if (
          period.startDay < 1 ||
          period.startDay > 366 ||
          period.endDay < 1 ||
          period.endDay > 366 ||
          period.startDay > period.endDay
        ) {
          throw new Error(
            `Periodo inválido: startDay=${period.startDay}, endDay=${period.endDay}`,
          );
        }
      }

      this.addDropPeriods.length = 0;
      this.addDropPeriods.push(...periods);
      this.logger.log(
        `Periodos add/drop actualizados: ${JSON.stringify(periods)}`,
      );
    } catch (error) {
      this.logger.error(
        `Error configurando periodos add/drop: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Obtiene los periodos add/drop configurados
   */
  getAddDropPeriods(): AddDropPeriodConfig[] {
    return [...this.addDropPeriods];
  }
}
