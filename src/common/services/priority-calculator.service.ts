import { Injectable } from '@nestjs/common';

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL', 
  HIGH = 'HIGH',
  URGENT = 'URGENT'
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

@Injectable()
export class PriorityCalculatorService {
  
  /**
   * Calcula prioridad basada en criterios objetivos
   */
  calculatePriority(context: PriorityContext): Priority {
    let priority = Priority.NORMAL; // Por defecto

    // Criterio 1: Estudiantes próximos a graduar (último semestre)
    if (context.studentSemester && context.studentSemester >= 10) {
      priority = Priority.HIGH;
    }

    // Criterio 2: Materias obligatorias tienen mayor prioridad
    if (context.isTargetMandatory) {
      priority = Priority.HIGH;
    }

    // Criterio 3: Periodo add/drop tiene menor prioridad
    if (context.isAddDropPeriod) {
      priority = Priority.LOW;
    }

    // Criterio 4: Casos urgentes (combinación de factores)
    if (context.studentSemester && context.studentSemester >= 10 && context.isTargetMandatory) {
      priority = Priority.URGENT;
    }

    return priority;
  }

  /**
   * Obtiene descripción de la prioridad calculada
   */
  getPriorityDescription(priority: Priority): string {
    const descriptions = {
      [Priority.LOW]: 'Prioridad baja - Periodo add/drop o electivas',
      [Priority.NORMAL]: 'Prioridad normal - Solicitud estándar',
      [Priority.HIGH]: 'Prioridad alta - Materia obligatoria o estudiante avanzado',
      [Priority.URGENT]: 'Prioridad urgente - Estudiante próximo a graduar con materia obligatoria'
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
      [Priority.URGENT]: 4
    };

    return weights[priority];
  }

  /**
   * Determina si es periodo add/drop (simulación)
   */
  isAddDropPeriod(date: Date = new Date()): boolean {
    // Simulación: primeras 2 semanas del semestre
    // En implementación real, consultar calendario académico
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Simular periodos add/drop: días 15-29 y 195-209 del año
    return (dayOfYear >= 15 && dayOfYear <= 29) || (dayOfYear >= 195 && dayOfYear <= 209);
  }
}