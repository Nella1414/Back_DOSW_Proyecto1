import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProgramCourse,
  ProgramCourseDocument,
} from '../../programs/entities/program.entity';
import {
  Student,
  StudentDocument,
} from '../../students/entities/student.entity';

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
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    @InjectModel(ProgramCourse.name)
    private programCourseModel: Model<ProgramCourseDocument>,
    @InjectModel(Student.name)
    private studentModel: Model<StudentDocument>,
  ) {}

  /**
   * Determina automáticamente el programa para asignar la solicitud
   */
  async determineProgram(context: RoutingContext): Promise<RoutingDecision> {
    try {
      // Obtener programas de las materias
      const sourceProgramId = await this.getSubjectProgram(
        context.sourceSubjectId,
      );
      const targetProgramId = await this.getSubjectProgram(
        context.targetSubjectId,
      );
      const studentProgramId =
        context.studentProgramId ||
        (await this.getStudentProgram(context.userId));

      this.logger.log(
        `Ruteo para usuario ${context.userId}: origen=${sourceProgramId}, destino=${targetProgramId}, estudiante=${studentProgramId}`,
      );

      // Regla 1: Si ambas materias del mismo programa → ese programa
      if (
        sourceProgramId &&
        targetProgramId &&
        sourceProgramId === targetProgramId
      ) {
        return {
          assignedProgramId: sourceProgramId,
          reason: `Ambas materias pertenecen al programa ${sourceProgramId}`,
          rule: 'SAME_PROGRAM',
        };
      }

      // Regla 2: Si materias de programas diferentes → programa de destino
      if (
        sourceProgramId &&
        targetProgramId &&
        sourceProgramId !== targetProgramId
      ) {
        return {
          assignedProgramId: targetProgramId,
          reason: `Materias de diferentes programas, se asigna al programa destino ${targetProgramId}`,
          rule: 'TARGET_PROGRAM',
        };
      }

      // Regla 3: Si solo materia origen tiene programa → programa origen
      if (sourceProgramId && !targetProgramId) {
        return {
          assignedProgramId: sourceProgramId,
          reason: `Solo materia origen tiene programa definido ${sourceProgramId}`,
          rule: 'SOURCE_PROGRAM',
        };
      }

      // Regla 4: Si solo materia destino tiene programa → programa destino
      if (!sourceProgramId && targetProgramId) {
        return {
          assignedProgramId: targetProgramId,
          reason: `Solo materia destino tiene programa definido ${targetProgramId}`,
          rule: 'TARGET_PROGRAM',
        };
      }

      // Fallback: programa del estudiante
      return {
        assignedProgramId: studentProgramId,
        reason: `Fallback al programa del estudiante ${studentProgramId}`,
        rule: 'STUDENT_PROGRAM',
      };
    } catch (error) {
      this.logger.error(
        `Error en determinación de programa: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `No se pudo determinar el programa para la solicitud: ${error.message}`,
      );
    }
  }

  /**
   * Obtiene el programa de una materia consultando la base de datos
   */
  private async getSubjectProgram(courseId: string): Promise<string | null> {
    try {
      // Buscar el programa al que pertenece el curso
      const programCourse = await this.programCourseModel
        .findOne({ courseId })
        .populate('programId')
        .exec();

      if (!programCourse) {
        this.logger.warn(`No se encontró programa para el curso ${courseId}`);
        return null;
      }

      return programCourse.programId;
    } catch (error) {
      this.logger.error(
        `Error al obtener programa del curso ${courseId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Obtiene el programa del estudiante consultando la base de datos
   */
  private async getStudentProgram(userId: string): Promise<string> {
    try {
      const student = await this.studentModel
        .findOne({ externalId: userId })
        .select('programId')
        .exec();

      if (!student || !student.programId) {
        this.logger.error(
          `No se encontró programa para el estudiante ${userId}`,
        );
        throw new Error(`Estudiante ${userId} no tiene programa asignado`);
      }

      return student.programId;
    } catch (error) {
      this.logger.error(
        `Error al obtener programa del estudiante ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Valida que el programa asignado existe y está activo
   */
  async validateProgram(programId: string): Promise<boolean> {
    try {
      const program = await this.programCourseModel
        .findOne({ programId, isActive: true })
        .exec();

      return !!program;
    } catch (error) {
      this.logger.error(
        `Error al validar programa ${programId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Obtiene estadísticas de ruteo
   */
  getRoutingStats(): Record<string, string> {
    return {
      SAME_PROGRAM: 'Ambas materias del mismo programa',
      TARGET_PROGRAM: 'Programa de materia destino',
      SOURCE_PROGRAM: 'Programa de materia origen',
      STUDENT_PROGRAM: 'Programa del estudiante (fallback)',
    };
  }
}
