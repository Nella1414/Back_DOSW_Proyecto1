import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChangeRequest,
  ChangeRequestDocument,
  RequestState,
} from '../entities/change-request.entity';
import {
  RequestStateDefinition,
  RequestStateDefinitionDocument,
} from '../entities/request-state-definition.entity';
import { StateAuditService } from './state-audit.service';
import { StateTransitionService } from './state-transition.service';
import { ScheduleValidationService } from '../../schedules/services/schedule-validation.service';
import {
  RequestCurrentStateResponseDto,
  CurrentStateInfoDto,
  AvailableActionDto,
  RequestBasicInfoDto,
  LastUpdateInfoDto,
  CourseChangeInfoDto,
} from '../dto/current-state-response.dto';
import { CourseInfoDto } from '../dto/change-request-response.dto';
import { Student, StudentDocument } from '../../students/entities/student.entity';
import { Program, ProgramDocument } from '../../programs/entities/program.entity';
import { AcademicPeriod, AcademicPeriodDocument } from '../../academic-periods/entities/academic-period.entity';
import { CourseGroup, CourseGroupDocument } from '../../course-groups/entities/course-group.entity';
import { User, UserDocument } from '../../users/entities/user.entity';

/**
 * * Current State Service
 *
 * ? Servicio especializado en obtener información consolidada del estado actual
 * ? Incluye toda la información necesaria para mostrar el detalle completo
 */
@Injectable()
export class CurrentStateService {
  constructor(
    @InjectModel(ChangeRequest.name)
    private changeRequestModel: Model<ChangeRequestDocument>,
    @InjectModel(RequestStateDefinition.name)
    private stateDefinitionModel: Model<RequestStateDefinitionDocument>,
    @InjectModel(Student.name)
    private studentModel: Model<StudentDocument>,
    @InjectModel(Program.name)
    private programModel: Model<ProgramDocument>,
    @InjectModel(AcademicPeriod.name)
    private academicPeriodModel: Model<AcademicPeriodDocument>,
    @InjectModel(CourseGroup.name)
    private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private stateAuditService: StateAuditService,
    private stateTransitionService: StateTransitionService,
    private scheduleValidationService: ScheduleValidationService,
  ) {}

  /**
   * * Obtiene información completa del estado actual de una solicitud
   * @param requestId - ID de la solicitud
   * @param userPermissions - Permisos del usuario actual (opcional)
   * @returns Información consolidada completa
   */
  async getCurrentStateInfo(
    requestId: string,
    userPermissions: string[] = [],
  ): Promise<RequestCurrentStateResponseDto> {
    // 1. Obtener la solicitud con todos los populate necesarios
    const request = await this.changeRequestModel
      .findById(requestId)
      .populate('studentId')
      .populate('programId')
      .populate('periodId')
      .populate('sourceGroupId')
      .populate('targetGroupId')
      .populate('lastStateChangedBy')
      .exec();

    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    // 2. Obtener definición del estado actual
    const stateDefinition = await this.stateDefinitionModel
      .findOne({ name: request.state })
      .exec();

    // 3. Obtener información del estudiante
    const student = request.studentId as any;
    const program = request.programId as any;
    const period = request.periodId as any;

    // 4. Obtener información de las materias
    const sourceGroup = request.sourceGroupId as any;
    const targetGroup = request.targetGroupId as any;

    // 5. Obtener horarios
    const sourceSchedules = await this.scheduleValidationService.getGroupSchedule(
      sourceGroup._id,
    );
    const targetSchedules = await this.scheduleValidationService.getGroupSchedule(
      targetGroup._id,
    );

    // 6. Validar conflictos de horario actuales
    const validation = await this.scheduleValidationService.validateChangeRequest(
      request.studentId as string,
      request.sourceGroupId,
      request.targetGroupId as string,
    );

    // 7. Obtener transiciones disponibles
    const availableTransitions = await this.stateTransitionService.getAvailableTransitions(
      request.state,
    );

    // 8. Obtener estadísticas del historial
    const stats = await this.stateAuditService.getHistoryStats(requestId);
    const hasTransitions = await this.stateAuditService.hasTransitions(requestId);

    // 9. Obtener último cambio de estado
    const lastStateChange = await this.stateAuditService.getLastStateChange(requestId);

    // 10. Obtener información del último actor
    let lastChangedByUser: UserDocument | null = null;
    if (request.lastStateChangedBy) {
      lastChangedByUser = (await this.userModel
        .findById(request.lastStateChangedBy)
        .exec()) as UserDocument | null;
    }

    // 11. Construir respuesta consolidada
    return {
      basicInfo: this.buildBasicInfo(request, student, program, period),
      currentState: this.buildCurrentStateInfo(
        request,
        stateDefinition,
        lastStateChange,
        lastChangedByUser,
      ),
      courseChange: this.buildCourseChangeInfo(
        sourceGroup,
        targetGroup,
        sourceSchedules,
        targetSchedules,
        validation,
      ),
      lastUpdate: this.buildLastUpdateInfo(request, lastChangedByUser),
      availableActions: this.buildAvailableActions(
        availableTransitions,
        userPermissions,
      ),
      metrics: this.buildMetrics(request, stats, hasTransitions),
      flags: this.buildFlags(request),
    };
  }

  /**
   * * Construye información básica de la solicitud
   * @private
   */
  private buildBasicInfo(
    request: ChangeRequestDocument,
    student: any,
    program: any,
    period: any,
  ): RequestBasicInfoDto {
    return {
      id: request.id.toString(),
      radicado: request.radicado,
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      studentEmail: student.email,
      programName: program.name,
      periodCode: period.code,
      periodName: period.name,
      priority: request.priority,
      exceptional: request.exceptional,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
      resolutionReason: request.resolutionReason,
      dueAt: request.dueAt,
    };
  }

  /**
   * * Construye información del estado actual
   * @private
   */
  private buildCurrentStateInfo(
    request: ChangeRequestDocument,
    stateDefinition: RequestStateDefinitionDocument | null,
    lastStateChange: any,
    lastChangedByUser: any,
  ): CurrentStateInfoDto {
    return {
      state: request.state,
      stateName: stateDefinition?.name || request.state,
      stateDescription: stateDefinition?.description || '',
      stateColor: stateDefinition?.color || '#6B7280',
      timestamp: request.lastStateChangedAt || request.createdAt,
      changedBy: request.lastStateChangedBy as string,
      changedByName: lastChangedByUser?.displayName || lastStateChange?.actorName,
      version: request.version,
    };
  }

  /**
   * * Construye información del cambio de materias
   * @private
   */
  private buildCourseChangeInfo(
    sourceGroup: any,
    targetGroup: any,
    sourceSchedules: any[],
    targetSchedules: any[],
    validation: any,
  ): CourseChangeInfoDto {
    return {
      sourceCourse: {
        courseId: sourceGroup.courseId._id,
        courseCode: sourceGroup.courseId.code,
        courseName: sourceGroup.courseId.name,
        groupNumber: sourceGroup.groupNumber,
        schedule: sourceSchedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
        })),
      },
      targetCourse: {
        courseId: targetGroup.courseId._id,
        courseCode: targetGroup.courseId.code,
        courseName: targetGroup.courseId.name,
        groupNumber: targetGroup.groupNumber,
        schedule: targetSchedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
        })),
      },
      hasScheduleConflict: !validation.isValid,
      conflictDetails: validation.errors || [],
    };
  }

  /**
   * * Construye información de la última actualización
   * @private
   */
  private buildLastUpdateInfo(
    request: ChangeRequestDocument,
    lastChangedByUser: any,
  ): LastUpdateInfoDto {
    return {
      updatedAt: request.updatedAt,
      updatedBy: request.lastStateChangedBy as string,
      updatedByName: lastChangedByUser?.displayName,
      observations: request.observations,
    };
  }

  /**
   * * Construye acciones disponibles para el usuario
   * @private
   */
  private buildAvailableActions(
    transitions: any[],
    userPermissions: string[],
  ): AvailableActionDto[] {
    return transitions
      .filter((transition) => {
        // Filtrar por permisos si el usuario tiene permisos limitados
        if (userPermissions.length === 0) return true;
        
        const requiredPerms = transition.requiredPermissions || [];
        if (requiredPerms.length === 0) return true;
        
        return requiredPerms.some((perm: string) => userPermissions.includes(perm));
      })
      .map((transition) => ({
        action: `change_to_${transition.toState.toLowerCase()}`,
        toState: transition.toState,
        label: this.getActionLabel(transition.toState),
        description: transition.description,
        requiresReason: transition.requiresReason || false,
        requiredPermissions: transition.requiredPermissions || [],
        buttonType: this.getButtonType(transition.toState),
      }));
  }

  /**
   * * Construye métricas de la solicitud
   * @private
   */
  private buildMetrics(
    request: ChangeRequestDocument,
    stats: any,
    hasTransitions: boolean,
  ): {
    daysInCurrentState: number;
    daysSinceCreation: number;
    hasTransitions: boolean;
    totalStateChanges: number;
  } {
    const now = new Date();
    const stateChangeDate = request.lastStateChangedAt || request.createdAt;
    
    const daysInCurrentState = Math.floor(
      (now.getTime() - stateChangeDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    
    const daysSinceCreation = Math.floor(
      (now.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      daysInCurrentState,
      daysSinceCreation,
      hasTransitions,
      totalStateChanges: stats.totalStateChanges,
    };
  }

  /**
   * * Construye flags de estado
   * @private
   */
  private buildFlags(request: ChangeRequestDocument): {
    canBeModified: boolean;
    isResolved: boolean;
    isPending: boolean;
    requiresAttention: boolean;
  } {
    const isResolved =
      request.state === RequestState.APPROVED ||
      request.state === RequestState.REJECTED;
    
    const isPending = request.state === RequestState.PENDING;
    
    const requiresAttention =
      request.state === RequestState.WAITING_INFO ||
      (isPending && request.priority > 5);

    return {
      canBeModified: !isResolved,
      isResolved,
      isPending,
      requiresAttention,
    };
  }

  /**
   * * Obtiene la etiqueta para una acción
   * @private
   */
  private getActionLabel(toState: string): string {
    const labels: Record<string, string> = {
      APPROVED: 'Aprobar',
      REJECTED: 'Rechazar',
      IN_REVIEW: 'Poner en Revisión',
      WAITING_INFO: 'Solicitar Información',
      PENDING: 'Volver a Pendiente',
    };
    return labels[toState] || toState;
  }

  /**
   * * Obtiene el tipo de botón según el estado destino
   * @private
   */
  private getButtonType(
    toState: string,
  ): 'primary' | 'success' | 'danger' | 'warning' | 'info' {
    const types: Record<string, any> = {
      APPROVED: 'success',
      REJECTED: 'danger',
      IN_REVIEW: 'primary',
      WAITING_INFO: 'warning',
      PENDING: 'info',
    };
    return types[toState] || 'primary';
  }
}