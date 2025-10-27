import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChangeRequest,
  ChangeRequestDocument,
  RequestState,
} from '../entities/change-request.entity';
import {
  Student,
  StudentDocument,
} from '../../students/entities/student.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../../course-groups/entities/course-group.entity';
import { Course, CourseDocument } from '../../courses/entities/course.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../../enrollments/entities/enrollment.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../../academic-periods/entities/academic-period.entity';
import {
  Program,
  ProgramDocument,
} from '../../programs/entities/program.entity';
import { ScheduleValidationService } from '../../schedules/services/schedule-validation.service';
import {
  CreateChangeRequestDto,
  ChangeRequestResponseDto,
  ApproveChangeRequestDto,
  RejectChangeRequestDto,
} from '../dto/change-request-response.dto';
import {
  RequestHistoryResponseDto,
  HistoryStatsDto,
  TimelineEventDto,
} from '../dto/history-response.dto';
import { RequestCurrentStateResponseDto } from '../dto/current-state-response.dto';
import { StateManagementService } from './state-management.service';
import { StateAuditService } from './state-audit.service';
import { CurrentStateService } from './current-state.service';

/**
 * * Change Requests Management Service
 *
 * ? Servicio completamente implementado con logica compleja de solicitudes
 * ? Maneja cambios de grupos de materias con validaciones completas
 * ? Incluye generacion de radicados, aprobaciones y rechazos
 */
@Injectable()
export class ChangeRequestsService {
  constructor(
    @InjectModel(ChangeRequest.name)
    private changeRequestModel: Model<ChangeRequestDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(CourseGroup.name)
    private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(AcademicPeriod.name)
    private academicPeriodModel: Model<AcademicPeriodDocument>,
    @InjectModel(Program.name) private programModel: Model<ProgramDocument>,
    private scheduleValidationService: ScheduleValidationService,
    private stateManagementService: StateManagementService,
    private stateAuditService: StateAuditService,
    private currentStateService: CurrentStateService,
  ) {}

  /**
   * * Create new change request for student with automatic audit
   * ? Registra automáticamente el evento de creación en el historial
   */
  async createChangeRequest(
    studentCode: string,
    createChangeRequestDto: CreateChangeRequestDto,
  ): Promise<ChangeRequestResponseDto> {
    // 1. Buscar estudiante
    const student = await this.studentModel
      .findOne({ code: studentCode })
      .exec();
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // 2. Validar solicitud
    const validation =
      await this.scheduleValidationService.validateChangeRequest(
        student._id as string,
        createChangeRequestDto.sourceGroupId,
        createChangeRequestDto.targetGroupId,
      );

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Invalid change request',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // 3. Obtener información de grupos y periodo
    const sourceGroup = await this.courseGroupModel
      .findById(createChangeRequestDto.sourceGroupId)
      .populate('courseId')
      .populate('periodId')
      .exec();

    const targetGroup = await this.courseGroupModel
      .findById(createChangeRequestDto.targetGroupId)
      .populate('courseId')
      .populate('periodId')
      .exec();

    if (!sourceGroup) {
      throw new NotFoundException('Source group not found');
    }

    if (!targetGroup) {
      throw new NotFoundException('Target group not found');
    }

    const program = await this.programModel.findById(student.programId).exec();

    // 4. Generar radicado único
    const radicado = await this.generateUniqueRadicado();

    // 5. Crear solicitud
    const changeRequest = new this.changeRequestModel({
      radicado,
      studentId: student._id,
      programId: student.programId,
      periodId: sourceGroup.periodId,
      sourceCourseId: sourceGroup.courseId,
      sourceGroupId: createChangeRequestDto.sourceGroupId,
      targetCourseId: targetGroup.courseId,
      targetGroupId: createChangeRequestDto.targetGroupId,
      state: RequestState.PENDING,
      priority: createChangeRequestDto.priority || 1,
      observations: createChangeRequestDto.observations,
      exceptional: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedRequest = await changeRequest.save();

    // 6. AUDITORÍA: Registrar la creación de la solicitud
    await this.stateAuditService.recordCreation(
      savedRequest._id as string,
      RequestState.PENDING,
      student._id as string,
      `${student.firstName} ${student.lastName}`,
    );

    return this.mapToResponseDto(
      savedRequest,
      student,
      program,
      sourceGroup,
      targetGroup,
    );
  }

  /**
   * * Get change requests by faculty with filters
   */
  async getRequestsByFaculty(
    facultyId: string,
    filters?: {
      status?: RequestState;
      periodId?: string;
      studentId?: string;
    },
  ): Promise<ChangeRequestResponseDto[]> {
    const programs = await this.programModel.find({ facultyId }).exec();
    const programIds = programs.map((p) => p._id);

    const query: any = { programId: { $in: programIds } };

    if (filters?.status) {
      query.state = filters.status;
    }
    if (filters?.periodId) {
      query.periodId = filters.periodId;
    }
    if (filters?.studentId) {
      const student = await this.studentModel
        .findOne({ code: filters.studentId })
        .exec();
      if (student) {
        query.studentId = student._id;
      }
    }

    const requests = await this.changeRequestModel
      .find(query)
      .populate('studentId')
      .populate('programId')
      .populate('periodId')
      .populate('sourceCourseId')
      .populate('targetCourseId')
      .populate('sourceGroupId')
      .populate('targetGroupId')
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(
      requests.map(async (request) => {
        const sourceGroup = await this.courseGroupModel
          .findById(request.sourceGroupId)
          .populate('courseId')
          .exec();
        const targetGroup = await this.courseGroupModel
          .findById(request.targetGroupId)
          .populate('courseId')
          .exec();

        return this.mapToResponseDto(
          request,
          request.studentId as any,
          request.programId as any,
          sourceGroup,
          targetGroup,
        );
      }),
    );
  }

  /**
   * * Approve change request with idempotent state management
   */
  async approveChangeRequest(
    requestId: string,
    approveDto: ApproveChangeRequestDto,
    actorId?: string,
    actorName?: string,
  ): Promise<ChangeRequestResponseDto> {
    const request = await this.changeRequestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const validation =
      await this.scheduleValidationService.validateChangeRequest(
        request.studentId,
        request.sourceGroupId,
        request.targetGroupId as string,
      );

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Request is no longer valid',
        errors: validation.errors,
      });
    }

    await this.executeChangeRequest(request);

    await this.stateManagementService.changeState(
      requestId,
      RequestState.APPROVED,
      {
        actorId,
        actorName,
        reason: approveDto.resolutionReason || 'Request approved',
        observations: approveDto.observations,
      },
    );

    return this.getRequestDetails(requestId);
  }

  /**
   * * Reject change request with idempotent state management
   */
  async rejectChangeRequest(
    requestId: string,
    rejectDto: RejectChangeRequestDto,
    actorId?: string,
    actorName?: string,
  ): Promise<ChangeRequestResponseDto> {
    const request = await this.changeRequestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    await this.stateManagementService.changeState(
      requestId,
      RequestState.REJECTED,
      {
        actorId,
        actorName,
        reason: rejectDto.resolutionReason,
        observations: rejectDto.observations,
      },
    );

    return this.getRequestDetails(requestId);
  }

  /**
   * * Request additional information from student
   */
  async requestAdditionalInfo(
    requestId: string,
    reason: string,
    observations?: string,
    actorId?: string,
    actorName?: string,
  ): Promise<ChangeRequestResponseDto> {
    await this.stateManagementService.changeState(
      requestId,
      RequestState.WAITING_INFO,
      {
        actorId,
        actorName,
        reason,
        observations,
      },
    );

    return this.getRequestDetails(requestId);
  }

  /**
   * * Move request to in-review state
   */
  async moveToReview(
    requestId: string,
    actorId?: string,
    actorName?: string,
  ): Promise<ChangeRequestResponseDto> {
    await this.stateManagementService.changeState(
      requestId,
      RequestState.IN_REVIEW,
      {
        actorId,
        actorName,
      },
    );

    return this.getRequestDetails(requestId);
  }

  async getRequestDetails(
    requestId: string,
  ): Promise<ChangeRequestResponseDto> {
    const request = await this.changeRequestModel
      .findById(requestId)
      .populate('studentId')
      .populate('programId')
      .exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const sourceGroup = await this.courseGroupModel
      .findById(request.sourceGroupId)
      .populate('courseId')
      .exec();
    const targetGroup = await this.courseGroupModel
      .findById(request.targetGroupId)
      .populate('courseId')
      .exec();

    return this.mapToResponseDto(
      request,
      request.studentId as any,
      request.programId as any,
      sourceGroup,
      targetGroup,
    );
  }

  /**
   * * Get complete current state information
   */
  async getCurrentStateInfo(
    requestId: string,
    userPermissions: string[] = [],
  ): Promise<RequestCurrentStateResponseDto> {
    return this.currentStateService.getCurrentStateInfo(
      requestId,
      userPermissions,
    );
  }

async getRequestHistory(requestId: string): Promise<RequestHistoryResponseDto> {
  // Verify request exists
  const request = await this.changeRequestModel.findById(requestId).exec();
  if (!request) {
    throw new NotFoundException('Request not found');
  }

  // Retrieve enriched history (may return undefined/null)
  const history: any[] = (await this.stateAuditService.getEnrichedHistory(requestId)) || [];

  // Safely obtain other values
  const hasTransitions = await this.stateAuditService.hasTransitions(requestId);
  const stats = (await this.stateAuditService.getHistoryStats(requestId)) || { totalStateChanges: 0 };

  const firstEvent = history[0];
  const lastEvent = history.length > 0 ? history[history.length - 1] : undefined;

  return {
    requestId,
    radicado: request.radicado ?? null,
    totalEvents: history.length,
    hasTransitions,
    noTransitions: !hasTransitions,
    events: history.map((event) => ({
      id: event._id?.toString?.() ?? event.id ?? null,
      requestId: event.requestId ?? requestId,
      fromState: event.fromState ?? null,
      toState: event.toState ?? null,
      changeType: event.changeType ?? null,
      actorId: event.actorId ?? null,
      actorName: event.actorName ?? null,
      actorEmail: event.actorEmail ?? null,
      reason: event.reason ?? null,
      timestamp:
        event.timestamp
          ? new Date(event.timestamp)
          : event.createdAt
          ? new Date(event.createdAt)
          : request.createdAt
          ? new Date(request.createdAt)
          : new Date(),
      metadata: event.metadata ?? null,
      description: event.description ?? null,
      readableDescription: event.readableDescription ?? null,
    })),
    summary: {
      createdAt: firstEvent?.timestamp ? new Date(firstEvent.timestamp) : request.createdAt ?? null,
      createdBy: firstEvent?.actorName ?? firstEvent?.actorId ?? 'System',
      currentState: request.state,
      lastChangedAt: lastEvent?.timestamp ? new Date(lastEvent.timestamp) : request.updatedAt ?? null,
      lastChangedBy: lastEvent?.actorName ?? lastEvent?.actorId ?? 'System',
      totalStateChanges: stats.totalStateChanges ?? 0,
    },
  };
}

  /**
   * * Get history statistics for a request
   */
  async getHistoryStats(requestId: string): Promise<HistoryStatsDto> {
    const request = await this.changeRequestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return this.stateAuditService.getHistoryStats(requestId);
  }

  /**
   * * Get timeline events for frontend display
   */
  async getRequestTimeline(requestId: string): Promise<TimelineEventDto[]> {
    const historyResponse = await this.getRequestHistory(requestId);

    return historyResponse.events.map((event) => ({
      id: event.id,
      type: this.mapChangeTypeToTimelineType(event.changeType),
      timestamp: event.timestamp,
      actor: event.actorName,
      actorEmail: event.actorEmail,
      fromState: event.fromState,
      toState: event.toState,
      reason: event.reason,
      description: event.description,
      readableDescription: event.readableDescription,
      icon: this.getTimelineIcon(event.changeType, event.toState),
      color: this.getTimelineColor(event.changeType, event.toState),
    }));
  }

  /**
   * * Check if request has any state transitions
   */
  async hasStateTransitions(requestId: string): Promise<boolean> {
    return this.stateAuditService.hasTransitions(requestId);
  }

  /**
   * * Get available state transitions and actions
   */
  async getAvailableActions(requestId: string): Promise<{
    currentState: RequestState;
    version: number;
    availableTransitions: {
      toState: string;
      description?: string;
      requiresReason?: boolean;
      requiredPermissions?: string[];
    }[];
  }> {
    const stateInfo =
      await this.stateManagementService.getCurrentState(requestId);
    const transitions =
      await this.stateManagementService.getAvailableTransitionsForRequest(
        requestId,
      );

    return {
      currentState: stateInfo.state,
      version: stateInfo.version,
      availableTransitions: transitions,
    };
  }

  /**
   * * Generic state change method
   * ? Permite cambiar a cualquier estado válido
   * ? Útil para operaciones administrativas
   */
  async changeRequestState(
    requestId: string,
    toState: RequestState,
    options: {
      reason?: string;
      observations?: string;
      actorId?: string;
      actorName?: string;
      expectedVersion?: number;
    } = {},
  ): Promise<ChangeRequestResponseDto> {
    await this.stateManagementService.changeState(
      requestId,
      toState,
      {
        actorId: options.actorId,
        actorName: options.actorName,
        reason: options.reason,
        observations: options.observations,
      },
      options.expectedVersion,
    );

    return this.getRequestDetails(requestId);
  }

  // MÉTODOS PRIVADOS

  private mapChangeTypeToTimelineType(
    changeType: string,
  ): 'create' | 'state_change' | 'update' {
    switch (changeType) {
      case 'CREATE':
        return 'create';
      case 'STATE_CHANGE':
        return 'state_change';
      case 'UPDATE':
        return 'update';
      default:
        return 'update';
    }
  }

  private getTimelineIcon(changeType: string, toState: string): string {
    if (changeType === 'CREATE') return 'plus-circle';

    const icons: Record<string, string> = {
      APPROVED: 'check-circle',
      REJECTED: 'x-circle',
      IN_REVIEW: 'eye',
      WAITING_INFO: 'alert-circle',
      PENDING: 'clock',
    };

    return icons[toState] || 'circle';
  }

  private getTimelineColor(changeType: string, toState: string): string {
    if (changeType === 'CREATE') return '#6B7280';

    const colors: Record<string, string> = {
      APPROVED: '#10B981',
      REJECTED: '#EF4444',
      IN_REVIEW: '#3B82F6',
      WAITING_INFO: '#F59E0B',
      PENDING: '#FFA500',
    };

    return colors[toState] || '#6B7280';
  }

  private async executeChangeRequest(
    request: ChangeRequestDocument,
  ): Promise<void> {
    await this.enrollmentModel
      .updateOne(
        {
          studentId: request.studentId,
          groupId: request.sourceGroupId,
          status: EnrollmentStatus.ENROLLED,
        },
        {
          groupId: request.targetGroupId,
          updatedAt: new Date(),
        },
      )
      .exec();

    await this.courseGroupModel
      .updateOne(
        { _id: request.sourceGroupId },
        { $inc: { currentEnrollments: -1 } },
      )
      .exec();

    await this.courseGroupModel
      .updateOne(
        { _id: request.targetGroupId },
        { $inc: { currentEnrollments: 1 } },
      )
      .exec();
  }

  private async generateUniqueRadicado(): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

    let counter = 1;
    let radicado: string;

    do {
      radicado = `CR-${year}${month}-${counter.toString().padStart(4, '0')}`;
      const exists = await this.changeRequestModel.findOne({ radicado }).exec();
      if (!exists) break;
      counter++;
    } while (true);

    return radicado;
  }

  private async mapToResponseDto(
    request: ChangeRequestDocument,
    student: any,
    program: any,
    sourceGroup: any,
    targetGroup: any,
  ): Promise<ChangeRequestResponseDto> {
    const sourceSchedules =
      await this.scheduleValidationService.getGroupSchedule(sourceGroup._id);
    const targetSchedules =
      await this.scheduleValidationService.getGroupSchedule(targetGroup._id);

    return {
      id: request._id as string,
      radicado: request.radicado,
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      programName: program.name,
      periodCode: request.periodId,
      sourceCourse: {
        courseId: sourceGroup.courseId._id,
        courseCode: sourceGroup.courseId.code,
        courseName: sourceGroup.courseId.name,
        groupNumber: sourceGroup.groupNumber,
        schedule: sourceSchedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
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
        })),
      },
      state: request.state,
      priority: request.priority,
      observations: request.observations,
      exceptional: request.exceptional,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
      resolutionReason: request.resolutionReason,
    };
  }
}