import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../entities/enrollment.entity';
import {
  Student,
  StudentDocument,
} from '../../students/entities/student.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../../course-groups/entities/course-group.entity';
import {
  GroupSchedule,
  GroupScheduleDocument,
} from '../../group-schedules/entities/group-schedule.entity';

/**
 * * Enrollments Management Service
 *
 * ? Servicio bien implementado con funcionalidades completas de enrollment
 * ? Maneja inscripciones de estudiantes a grupos de materias
 * ? Incluye validaciones de duplicados y estados de enrollment
 * TODO: Agregar validacion de prerequisitos de materias
 * TODO: Implementar limite de creditos por semestre
 * TODO: Agregar validacion de capacidad maxima de grupos
 * TODO: Implementar notificaciones por cambios de estado
 */
@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  /**
   * * Constructor injects required MongoDB models
   * @param enrollmentModel - Mongoose model for Enrollment operations
   * @param studentModel - Mongoose model for Student lookup
   * @param courseGroupModel - Mongoose model for CourseGroup validation
   */
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(CourseGroup.name)
    private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(GroupSchedule.name)
    private groupScheduleModel: Model<GroupScheduleDocument>,
  ) {}

  /**
   * * Create new enrollment for student in course group
   * ? Funcion implementada con validaciones completas
   * ? Valida existencia de estudiante y grupo antes de crear
   * ? Previene enrollments duplicados en mismo grupo
   * TODO: Agregar validacion de prerequisitos de materia
   * TODO: Validar capacidad maxima del grupo
   * TODO: Verificar limite de creditos del estudiante
   */
  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.studentModel.findOne({
      code: createEnrollmentDto.studentId,
    });
    if (!student) {
      throw new NotFoundException(
        `Student with ID ${createEnrollmentDto.studentId} not found`,
      );
    }

    const group = await this.courseGroupModel
      .findById(createEnrollmentDto.groupId)
      .populate('courseId');
    if (!group) {
      throw new NotFoundException(
        `Course group with ID ${createEnrollmentDto.groupId} not found`,
      );
    }

    const existingEnrollment = await this.enrollmentModel.findOne({
      studentId: student._id,
      groupId: createEnrollmentDto.groupId,
      status: { $in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.PASSED] },
    });

    if (existingEnrollment) {
      throw new BadRequestException(
        'Student is already enrolled in this course group',
      );
    }

    const enrollment = new this.enrollmentModel({
      studentId: student._id,
      groupId: createEnrollmentDto.groupId,
      enrolledAt: new Date(),
      status: createEnrollmentDto.status || EnrollmentStatus.ENROLLED,
      grade: createEnrollmentDto.grade,
    });

    return enrollment.save();
  }

  /**
   * * Get all enrollments with populated relationships
   * ? Funcion implementada correctamente
   * ? Incluye datos de estudiante y grupo con materia
   * TODO: Agregar paginacion para mejor performance
   * TODO: Implementar filtros por estado, semestre, facultad
   */
  async findAll(): Promise<Enrollment[]> {
    return this.enrollmentModel
      .find()
      .populate('studentId')
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .exec();
  }

  /**
   * * Get specific enrollment by ID
   * ? Funcion implementada con validacion de existencia
   * ? Incluye datos relacionados de estudiante y grupo
   * TODO: Agregar cache para enrollments frecuentemente consultados
   */
  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findById(id)
      .populate('studentId')
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .exec();

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }

  /**
   * * Get all enrollments for specific student
   * ? Funcion implementada correctamente
   * ? Busca por codigo de estudiante y retorna todos sus enrollments
   * TODO: Agregar filtros por semestre o estado
   * TODO: Incluir estadisticas de progreso academico
   */
  async findByStudent(studentCode: string): Promise<Enrollment[]> {
    const student = await this.studentModel.findOne({ code: studentCode });
    if (!student) {
      throw new NotFoundException(`Student with code ${studentCode} not found`);
    }

    return this.enrollmentModel
      .find({ studentId: student._id })
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .exec();
  }

  /**
   * * Get only active (ENROLLED) enrollments for specific student
   * ? Returns only courses currently enrolled (not PASSED, FAILED, or CANCELLED)
   * ? Used for display in course unenrollment section
   */
  async findActiveEnrollmentsByStudent(
    studentCode: string,
  ): Promise<Enrollment[]> {
    const student = await this.studentModel.findOne({ code: studentCode });
    if (!student) {
      throw new NotFoundException(`Student with code ${studentCode} not found`);
    }

    return this.enrollmentModel
      .find({
        studentId: student._id,
        status: EnrollmentStatus.ENROLLED, // ! ONLY ACTIVE ENROLLMENTS
      })
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .exec();
  }

  /**
   * * Update enrollment information
   * ? Funcion implementada basicamente
   * ? Permite actualizar estado y calificaciones
   * TODO: Agregar validaciones de cambios de estado permitidos
   * TODO: Implementar audit trail para cambios importantes
   * TODO: Notificar estudiante sobre cambios de calificacion
   */
  async update(
    id: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel.findByIdAndUpdate(
      id,
      updateEnrollmentDto,
      { new: true },
    );

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }

  /**
   * * Remove enrollment from system
   * ? Funcion implementada con validacion basica
   * ? Elimina permanentemente el enrollment
   * TODO: Implementar soft delete para auditoria
   * TODO: Validar que no tenga calificaciones antes de eliminar
   * TODO: Actualizar estadisticas de grupo al eliminar
   */
  async remove(id: string): Promise<void> {
    const result = await this.enrollmentModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
  }

  /**
   * * Helper method to enroll student in course group
   * ? Funcion helper que simplifica enrollment basico
   * ? Usa el metodo create internamente con estado ENROLLED
   * TODO: Agregar validaciones adicionales especificas para este flujo
   */
  async enrollStudentInCourse(
    studentCode: string,
    groupId: string,
  ): Promise<Enrollment> {
    // Validate schedule conflicts before enrolling
    await this.validateScheduleConflicts(studentCode, groupId);

    return this.create({
      studentId: studentCode,
      groupId,
      status: EnrollmentStatus.ENROLLED,
    });
  }

  /**
   * * Unenroll student from course group
   * ? Removes enrollment and updates group capacity
   */
  async unenrollStudentFromCourse(
    studentCode: string,
    groupId: string,
  ): Promise<{ message: string }> {
    this.logger.log(
      `[UNENROLL SERVICE] Attempting to unenroll student ${studentCode} from group ${groupId}`,
    );

    const student = await this.studentModel.findOne({ code: studentCode });
    if (!student) {
      this.logger.warn(`[UNENROLL SERVICE] Student ${studentCode} not found`);
      throw new NotFoundException(`Student with code ${studentCode} not found`);
    }

    this.logger.log(
      `[UNENROLL SERVICE] Student found: ${student._id}, searching for enrollment...`,
    );

    // First, check if ANY enrollment exists for this student and group
    const anyEnrollment = await this.enrollmentModel
      .findOne({
        studentId: student._id,
        groupId: groupId,
      })
      .exec();

    this.logger.log(
      `[UNENROLL SERVICE] Any enrollment found: ${
        anyEnrollment
          ? `Yes (ID: ${anyEnrollment._id}, Status: ${anyEnrollment.status})`
          : 'No'
      }`,
    );

    const enrollment = await this.enrollmentModel.findOne({
      studentId: student._id,
      groupId: groupId,
      status: EnrollmentStatus.ENROLLED,
    });

    if (!enrollment) {
      this.logger.warn(
        `[UNENROLL SERVICE] No ENROLLED status found for student ${studentCode} in group ${groupId}`,
      );
      throw new NotFoundException(
        `Active enrollment not found for student ${studentCode} in group ${groupId}. ${anyEnrollment ? `Found enrollment with status: ${anyEnrollment.status}` : 'No enrollment record exists'}`,
      );
    }

    this.logger.log(
      `[UNENROLL SERVICE] Found enrollment ${enrollment._id}, proceeding to delete...`,
    );

    await this.enrollmentModel.deleteOne({ _id: enrollment._id });

    this.logger.log(
      `[UNENROLL SERVICE] Successfully deleted enrollment ${enrollment._id}`,
    );

    return {
      message: `Student ${studentCode} successfully unenrolled from group ${groupId}`,
    };
  }

  /**
   * * Validate if new group schedule conflicts with student's current schedule
   * ? Checks for time overlaps on the same days
   */
  private async validateScheduleConflicts(
    studentCode: string,
    newGroupId: string,
  ): Promise<void> {
    const student = await this.studentModel.findOne({ code: studentCode });
    if (!student) {
      throw new NotFoundException(`Student with code ${studentCode} not found`);
    }

    // Get new group's schedule
    const newGroupSchedules = await this.groupScheduleModel
      .find({ groupId: newGroupId })
      .exec();

    if (newGroupSchedules.length === 0) {
      return; // No schedule to conflict with
    }

    // Get student's current enrollments
    const currentEnrollments = await this.enrollmentModel
      .find({
        studentId: student._id,
        status: EnrollmentStatus.ENROLLED,
      })
      .exec();

    // Check each current enrollment for schedule conflicts
    for (const enrollment of currentEnrollments) {
      const enrollmentSchedules = await this.groupScheduleModel
        .find({ groupId: enrollment.groupId })
        .exec();

      for (const newSchedule of newGroupSchedules) {
        for (const existingSchedule of enrollmentSchedules) {
          // Check if schedules are on the same day
          if (newSchedule.dayOfWeek === existingSchedule.dayOfWeek) {
            // Check for time overlap
            const newStart = this.timeToMinutes(newSchedule.startTime);
            const newEnd = this.timeToMinutes(newSchedule.endTime);
            const existingStart = this.timeToMinutes(
              existingSchedule.startTime,
            );
            const existingEnd = this.timeToMinutes(existingSchedule.endTime);

            const hasOverlap =
              (newStart >= existingStart && newStart < existingEnd) ||
              (newEnd > existingStart && newEnd <= existingEnd) ||
              (newStart <= existingStart && newEnd >= existingEnd);

            if (hasOverlap) {
              // Get course info for better error message
              const existingGroup = await this.courseGroupModel
                .findById(enrollment.groupId)
                .populate('courseId')
                .exec();

              const courseName = existingGroup?.courseId
                ? (existingGroup.courseId as any).name
                : 'una materia existente';

              throw new ConflictException(
                `Conflicto de horario: La nueva materia tiene un horario que se superpone con ${courseName} el día ${this.getDayName(newSchedule.dayOfWeek)} de ${existingSchedule.startTime} a ${existingSchedule.endTime}`,
              );
            }
          }
        }
      }
    }
  }

  /**
   * * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * * Get day name from day number
   */
  private getDayName(dayOfWeek: number): string {
    const days = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    return days[dayOfWeek % 7] || 'Desconocido';
  }
}
