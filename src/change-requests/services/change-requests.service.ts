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
import { StateManagementService } from './state-management.service';


/**
 * * Change Requests Management Service
 *
 * ? Servicio completamente implementado con logica compleja de solicitudes
 * ? Maneja cambios de grupos de materias con validaciones completas
 * ? Incluye generacion de radicados, aprobaciones y rechazos
 * TODO: Agregar notificaciones por email para cambios de estado
 * TODO: Implementar dashboard de metricas de solicitudes
 * TODO: Agregar validacion de fechas limite para solicitudes
 * TODO: Implementar auditoria completa de cambios realizados
 */
@Injectable()
export class ChangeRequestsService {
  /**
   * * Constructor injects all required MongoDB models and services
   * @param changeRequestModel - Model for change requests
   * @param studentModel - Model for student lookup
   * @param courseGroupModel - Model for course group operations
   * @param courseModel - Model for course data
   * @param enrollmentModel - Model for enrollment updates
   * @param academicPeriodModel - Model for period validation
   * @param programModel - Model for program data
   * @param scheduleValidationService - Service for schedule conflict validation
   */
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
  // NUEVOS SERVICIOS
  private stateManagementService: StateManagementService,
) {}

  /**
   * * Create new change request for student
   * ? Funcion completamente implementada con validaciones completas
   * ? Valida horarios, genera radicado unico y crea solicitud
   * TODO: Agregar validacion de fechas limite para solicitudes
   * TODO: Implementar prioridad automatica basada en criterios
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedRequest = await changeRequest.save();

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
   * ? Funcion implementada con filtros por estado, periodo y estudiante
   * ? Busca solicitudes de todos los programas de la facultad
   * TODO: Agregar paginacion para mejor performance
   * TODO: Implementar ordenamiento por prioridad y fecha
   * TODO: Agregar estadisticas resumidas por facultad
   */
  async getRequestsByFaculty(
    facultyId: string,
    filters?: {
      status?: RequestState;
      periodId?: string;
      studentId?: string;
    },
  ): Promise<ChangeRequestResponseDto[]> {
    // Obtener estudiantes de programas de la facultad
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

  // Re-validar antes de aprobar
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

  // Ejecutar el cambio de matrícula primero
  await this.executeChangeRequest(request);

  // Cambiar estado usando el sistema de gestión de estados
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

  // Cambiar estado usando el sistema de gestión de estados
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
  const stateInfo = await this.stateManagementService.getCurrentState(requestId);
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

  private async executeChangeRequest(
    request: ChangeRequestDocument,
  ): Promise<void> {
    // Actualizar enrollment
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

    // Actualizar contadores de cupos
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
