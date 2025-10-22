import { Injectable } from '@nestjs/common';

export interface RoutingContext {
  userId: string;
  sourceSubjectId: string;
  targetSubjectId: string;
  studentProgramId?: string;
}

export interface RoutingDecision {
  assignedProgramId: string;
  reason: string;
  rule: string;
}

@Injectable()
export class RoutingService {

  /**
   * Determina automáticamente el programa para asignar la solicitud
   */
  async determineProgram(context: RoutingContext): Promise<RoutingDecision> {
    // Obtener programas de las materias
    const sourceProgramId = await this.getSubjectProgram(context.sourceSubjectId);
    const targetProgramId = await this.getSubjectProgram(context.targetSubjectId);
    const studentProgramId = context.studentProgramId || await this.getStudentProgram(context.userId);

    // Regla 1: Si ambas materias del mismo programa → ese programa
    if (sourceProgramId && targetProgramId && sourceProgramId === targetProgramId) {
      return {
        assignedProgramId: sourceProgramId,
        reason: `Ambas materias pertenecen al programa ${sourceProgramId}`,
        rule: 'SAME_PROGRAM'
      };
    }

    // Regla 2: Si materias de programas diferentes → programa de destino
    if (sourceProgramId && targetProgramId && sourceProgramId !== targetProgramId) {
      return {
        assignedProgramId: targetProgramId,
        reason: `Materias de diferentes programas, se asigna al programa destino ${targetProgramId}`,
        rule: 'TARGET_PROGRAM'
      };
    }

    // Regla 3: Si solo materia origen tiene programa → programa origen
    if (sourceProgramId && !targetProgramId) {
      return {
        assignedProgramId: sourceProgramId,
        reason: `Solo materia origen tiene programa definido ${sourceProgramId}`,
        rule: 'SOURCE_PROGRAM'
      };
    }

    // Regla 4: Si solo materia destino tiene programa → programa destino
    if (!sourceProgramId && targetProgramId) {
      return {
        assignedProgramId: targetProgramId,
        reason: `Solo materia destino tiene programa definido ${targetProgramId}`,
        rule: 'TARGET_PROGRAM'
      };
    }

    // Fallback: programa del estudiante
    return {
      assignedProgramId: studentProgramId,
      reason: `Fallback al programa del estudiante ${studentProgramId}`,
      rule: 'STUDENT_PROGRAM'
    };
  }

  /**
   * Obtiene el programa de una materia (simulación)
   */
  private async getSubjectProgram(subjectId: string): Promise<string | null> {
    // Simulación - en implementación real consultar base de datos
    // Usar último dígito del ID para simular diferentes programas
    const lastChar = subjectId.slice(-1);
    const lastDigit = parseInt(lastChar);
    
    if (isNaN(lastDigit)) return null;
    
    const programMap = {
      0: 'PROG-CS',      // Ciencias de la Computación
      1: 'PROG-CS',
      2: 'PROG-ING',     // Ingeniería
      3: 'PROG-ING',
      4: 'PROG-MAT',     // Matemáticas
      5: 'PROG-MAT',
      6: 'PROG-FIS',     // Física
      7: 'PROG-FIS',
      8: 'PROG-ADMIN',   // Administración
      9: 'PROG-ADMIN'
    };

    return programMap[lastDigit] || null;
  }

  /**
   * Obtiene el programa del estudiante (simulación)
   */
  private async getStudentProgram(userId: string): Promise<string> {
    // Simulación - en implementación real consultar base de datos
    // Usar hash simple del userId para asignar programa
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const programIndex = hash % 5;
    
    const programs = ['PROG-CS', 'PROG-ING', 'PROG-MAT', 'PROG-FIS', 'PROG-ADMIN'];
    return programs[programIndex];
  }

  /**
   * Valida que el programa asignado existe
   */
  async validateProgram(programId: string): Promise<boolean> {
    // Simulación - en implementación real consultar base de datos
    const validPrograms = ['PROG-CS', 'PROG-ING', 'PROG-MAT', 'PROG-FIS', 'PROG-ADMIN'];
    return validPrograms.includes(programId);
  }

  /**
   * Obtiene estadísticas de ruteo
   */
  getRoutingStats(): Record<string, string> {
    return {
      'SAME_PROGRAM': 'Ambas materias del mismo programa',
      'TARGET_PROGRAM': 'Programa de materia destino',
      'SOURCE_PROGRAM': 'Programa de materia origen',
      'STUDENT_PROGRAM': 'Programa del estudiante (fallback)'
    };
  }
}