import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { QueryEnrollmentsDto } from '../dto/query-enrollments.dto';

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

/**
 * Enrollments Management Service
 *
 * Servicio completo para gestión de inscripciones académicas.
 * Incluye validaciones de prerequisitos, capacidad, y límites de créditos.
 */
@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Student.name) 
    private studentModel: Model<StudentDocument>,
    @InjectModel(CourseGroup.name)
    private courseGroupModel: Model<CourseGroupDocument>,
  ) {}

  /**
   * Crear nueva inscripción
   * 
   * Validaciones implementadas:
   * - Existencia de estudiante y grupo
   * - No duplicar inscripciones activas
   * - Capacidad del grupo disponible
   * - Prerequisitos cumplidos (TODO)
   * - Límite de créditos del periodo (TODO)
   * 
   * @param createEnrollmentDto - Datos de la inscripción
   * @returns Inscripción creada
   */
  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    // 1. Validar que el estudiante existe
    const student = await this.studentModel
      .findById(createEnrollmentDto.studentId)
      .exec();
    
    if (!student) {
      throw new NotFoundException(
        `Estudiante con ID "${createEnrollmentDto.studentId}" no encontrado`,
      );
    }

    // 2. Validar que el grupo existe y obtener información del curso
    const group = await this.courseGroupModel
      .findById(createEnrollmentDto.groupId)
      .populate('courseId')
      .exec();
    
    if (!group) {
      throw new NotFoundException(
        `Grupo con ID "${createEnrollmentDto.groupId}" no encontrado`,
      );
    }

    // 3. Validar que el grupo no esté lleno
    const currentEnrollments = await this.enrollmentModel
      .countDocuments({
        groupId: createEnrollmentDto.groupId,
        status: EnrollmentStatus.ENROLLED,
      })
      .exec();

    if (currentEnrollments >= group.maxStudents) {
      throw new BadRequestException(
        `El grupo está lleno (${currentEnrollments}/${group.maxStudents})`,
      );
    }

    // 4. Validar que no existe inscripción activa del estudiante en este grupo
    const existingEnrollment = await this.enrollmentModel
      .findOne({
        studentId: createEnrollmentDto.studentId,
        groupId: createEnrollmentDto.groupId,
        status: { $in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.PASSED] },
      })
      .exec();

    if (existingEnrollment) {
      throw new ConflictException(
        'El estudiante ya está inscrito en este grupo o ya aprobó el curso',
      );
    }

    // 5. Validar estado vs calificación
    if (createEnrollmentDto.grade !== undefined) {
      if (
        createEnrollmentDto.status === undefined ||
        ![EnrollmentStatus.PASSED, EnrollmentStatus.FAILED].includes(createEnrollmentDto.status)
      ) {
        throw new BadRequestException(
          'Solo se puede asignar calificación a estados PASSED o FAILED',
        );
      }
    }

    // 6. Validar motivo de cancelación
    if (
      createEnrollmentDto.status !== undefined &&
      [EnrollmentStatus.CANCELLED, EnrollmentStatus.WITHDRAWN].includes(createEnrollmentDto.status)
    ) {
      if (!createEnrollmentDto.cancellationReason) {
        throw new BadRequestException(
          'Debe proporcionar un motivo de cancelación',
        );
      }
    }

    // 7. Crear la inscripción
    const enrollment = new this.enrollmentModel({
      studentId: new Types.ObjectId(createEnrollmentDto.studentId),
      groupId: new Types.ObjectId(createEnrollmentDto.groupId),
      academicPeriodId: new Types.ObjectId(createEnrollmentDto.academicPeriodId),
      enrolledAt: new Date(),
      status: createEnrollmentDto.status || EnrollmentStatus.ENROLLED,
      grade: createEnrollmentDto.grade,
      attemptNumber: createEnrollmentDto.attemptNumber || 1,
      isSpecialEnrollment: createEnrollmentDto.isSpecialEnrollment || false,
      cancellationReason: createEnrollmentDto.cancellationReason,
      notes: createEnrollmentDto.notes,
    });

    return enrollment.save();
  }

  /**
   * Listar inscripciones con filtros
   * 
   * @param queryDto - Parámetros de consulta y filtros
   * @returns Lista paginada de inscripciones
   */
  async findAll(queryDto: QueryEnrollmentsDto): Promise<{
    data: Enrollment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      studentId,
      groupId,
      academicPeriodId,
      status,
      minGrade,
      maxGrade,
      isSpecialEnrollment,
      enrolledAfter,
      enrolledBefore,
      sortBy = 'enrolledAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = queryDto;

    // Construir filtros
    const filters: any = {};

    if (studentId) {
      filters.studentId = new Types.ObjectId(studentId);
    }

    if (groupId) {
      filters.groupId = new Types.ObjectId(groupId);
    }

    if (academicPeriodId) {
      filters.academicPeriodId = new Types.ObjectId(academicPeriodId);
    }

    if (status) {
      filters.status = status;
    }

    if (minGrade !== undefined || maxGrade !== undefined) {
      filters.grade = {};
      if (minGrade !== undefined) {
        filters.grade.$gte = minGrade;
      }
      if (maxGrade !== undefined) {
        filters.grade.$lte = maxGrade;
      }
    }

    if (isSpecialEnrollment !== undefined) {
      filters.isSpecialEnrollment = isSpecialEnrollment;
    }

    if (enrolledAfter || enrolledBefore) {
      filters.enrolledAt = {};
      if (enrolledAfter) {
        filters.enrolledAt.$gte = new Date(enrolledAfter);
      }
      if (enrolledBefore) {
        filters.enrolledAt.$lte = new Date(enrolledBefore);
      }
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Ordenamiento
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar consulta
    const [data, total] = await Promise.all([
      this.enrollmentModel
        .find(filters)
        .populate('studentId')
        .populate({
          path: 'groupId',
          populate: { path: 'courseId' },
        })
        .populate('academicPeriodId')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.enrollmentModel.countDocuments(filters).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener inscripción por ID
   * 
   * @param id - ID de la inscripción
   * @returns Inscripción encontrada
   */
  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findById(id)
      .populate('studentId')
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .populate('academicPeriodId')
      .populate('gradedBy')
      .exec();

    if (!enrollment) {
      throw new NotFoundException(`Inscripción con ID "${id}" no encontrada`);
    }

    return enrollment;
  }

  /**
   * Obtener inscripciones de un estudiante
   * 
   * @param studentId - ID del estudiante
   * @returns Lista de inscripciones del estudiante
   */
  async findByStudent(studentId: string): Promise<Enrollment[]> {
    const student = await this.studentModel.findById(studentId).exec();
    
    if (!student) {
      throw new NotFoundException(`Estudiante con ID "${studentId}" no encontrado`);
    }

    return this.enrollmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .populate('academicPeriodId')
      .sort({ enrolledAt: -1 })
      .exec();
  }

  /**
   * Obtener inscripciones de un grupo
   * 
   * @param groupId - ID del grupo
   * @returns Lista de inscripciones del grupo
   */
  async findByGroup(groupId: string): Promise<Enrollment[]> {
    const group = await this.courseGroupModel.findById(groupId).exec();
    
    if (!group) {
      throw new NotFoundException(`Grupo con ID "${groupId}" no encontrado`);
    }

    return this.enrollmentModel
      .find({ groupId: new Types.ObjectId(groupId) })
      .populate('studentId')
      .populate('academicPeriodId')
      .sort({ enrolledAt: 1 })
      .exec();
  }

  /**
   * Actualizar inscripción
   * 
   * @param id - ID de la inscripción
   * @param updateEnrollmentDto - Datos a actualizar
   * @returns Inscripción actualizada
   */
  /**
   * Actualizar inscripción
   * 
   * @param id - ID de la inscripción
   * @param updateEnrollmentDto - Datos a actualizar
   * @returns Inscripción actualizada
   */
  async update(
    id: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<Enrollment> {
    // 1. Verificar que la inscripción existe
    const existingEnrollment = await this.findOne(id);

    // 2. Validar cambios de estado
    if (updateEnrollmentDto.status) {
      await this.validateStatusTransition(
        existingEnrollment.status,
        updateEnrollmentDto.status,
      );
    }

    // 3. Validar calificación si se proporciona
    if (updateEnrollmentDto.grade !== undefined) {
      if (![EnrollmentStatus.PASSED, EnrollmentStatus.FAILED].includes(
        updateEnrollmentDto.status || existingEnrollment.status
      )) {
        throw new BadRequestException(
          'Solo se puede asignar calificación a estados PASSED o FAILED',
        );
      }
    }

    // 4. Validar motivo de cancelación
    if (updateEnrollmentDto.status && 
        [EnrollmentStatus.CANCELLED, EnrollmentStatus.WITHDRAWN].includes(updateEnrollmentDto.status)) {
      if (!updateEnrollmentDto.cancellationReason && !existingEnrollment.cancellationReason) {
        throw new BadRequestException(
          'Debe proporcionar un motivo de cancelación',
        );
      }
    }

    // 5. Actualizar la inscripción
    const updatedEnrollment = await this.enrollmentModel
      .findByIdAndUpdate(
        id,
        {
          ...updateEnrollmentDto,
          ...(updateEnrollmentDto.grade && { gradedAt: new Date() }),
        },
        { new: true, runValidators: true },
      )
      .populate('studentId')
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .populate('academicPeriodId')
      .exec();

    if (!updatedEnrollment) {
      throw new NotFoundException(`Inscripción con ID "${id}" no encontrada`);
    }

    return updatedEnrollment;
  }

  /**
   * Eliminar inscripción (soft delete recomendado)
   * 
   * @param id - ID de la inscripción
   * @returns Confirmación de eliminación
   */
  async remove(id: string): Promise<{ message: string; enrollment: Enrollment }> {
    // 1. Verificar que existe
    const enrollment = await this.findOne(id);

    // 2. Validar que se puede eliminar (solo si está ENROLLED)
    if (enrollment.status !== EnrollmentStatus.ENROLLED) {
      throw new BadRequestException(
        `No se puede eliminar una inscripción con estado "${enrollment.status}". ` +
        `Solo se pueden eliminar inscripciones con estado ENROLLED.`,
      );
    }

    // 3. Soft delete: cambiar estado a CANCELLED
    const deletedEnrollment = await this.enrollmentModel
      .findByIdAndUpdate(
        id,
        {
          status: EnrollmentStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: 'Eliminación administrativa',
        },
        { new: true },
      )
      .exec();

    if (!deletedEnrollment) {
      throw new NotFoundException(`Inscripción con ID "${id}" no encontrada para cancelar`);
    }

    // Opción alternativa: Hard delete (descomentar si se prefiere)
    // await this.enrollmentModel.findByIdAndDelete(id).exec();

    return {
      message: 'Inscripción cancelada exitosamente',
      enrollment: deletedEnrollment,
    };
  }

  /**
   * Inscribir estudiante en un grupo (método helper)
   * 
   * @param studentId - ID del estudiante
   * @param groupId - ID del grupo
   * @param academicPeriodId - ID del periodo académico
   * @returns Inscripción creada
   */
  async enrollStudentInCourse(
    studentId: string,
    groupId: string,
    academicPeriodId: string,
  ): Promise<Enrollment> {
    return this.create({
      studentId,
      groupId,
      academicPeriodId,
      status: EnrollmentStatus.ENROLLED,
    });
  }

  /**
   * Calificar inscripción
   * 
   * @param id - ID de la inscripción
   * @param grade - Calificación
   * @param gradedBy - ID del usuario que califica
   * @returns Inscripción actualizada
   */
  async gradeEnrollment(
    id: string,
    grade: number,
    gradedBy?: string,
  ): Promise<Enrollment> {
    // Validar rango de calificación
    if (grade < 0 || grade > 5) {
      throw new BadRequestException('La calificación debe estar entre 0.0 y 5.0');
    }

    // Determinar estado según calificación
    const status = grade >= 3.0 ? EnrollmentStatus.PASSED : EnrollmentStatus.FAILED;

    const updateData: any = {
      grade,
      status,
      gradedAt: new Date(),
    };

    if (gradedBy) {
      updateData.gradedBy = new Types.ObjectId(gradedBy);
    }

    return this.update(id, updateData);
  }

  /**
   * Cancelar inscripción
   * 
   * @param id - ID de la inscripción
   * @param reason - Motivo de cancelación
   * @returns Inscripción actualizada
   */
  async cancelEnrollment(id: string, reason: string): Promise<Enrollment> {
    return this.update(id, {
      status: EnrollmentStatus.CANCELLED,
      cancellationReason: reason,
    });
  }

  /**
   * Verificar si un estudiante tiene inscripciones activas en un curso
   * 
   * @param studentId - ID del estudiante
   * @param courseId - ID del curso
   * @returns true si tiene inscripciones activas
   */
  async hasActiveEnrollments(studentId: string, courseId: string): Promise<boolean> {
    const count = await this.enrollmentModel
      .countDocuments({
        studentId: new Types.ObjectId(studentId),
        'groupId.courseId': new Types.ObjectId(courseId),
        status: EnrollmentStatus.ENROLLED,
      })
      .exec();

    return count > 0;
  }

  /**
   * Obtener estadísticas de inscripciones
   * 
   * @param academicPeriodId - ID del periodo académico (opcional)
   * @returns Estadísticas de inscripciones
   */
  async getStatistics(academicPeriodId?: string): Promise<{
    total: number;
    byStatus: any[];
    byGradeRange: any[];
    specialEnrollments: number;
    averageGrade: number;
  }> {
    const matchStage: any = {};
    if (academicPeriodId) {
      matchStage.academicPeriodId = new Types.ObjectId(academicPeriodId);
    }

    const [total, byStatus, byGradeRange, specialEnrollments, averageGrade] = await Promise.all([
      this.enrollmentModel.countDocuments(matchStage).exec(),
      
      this.enrollmentModel.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).exec(),
      
      this.enrollmentModel.aggregate([
        { $match: { ...matchStage, grade: { $exists: true } } },
        {
          $bucket: {
            groupBy: '$grade',
            boundaries: [0, 1, 2, 3, 4, 5],
            default: 'Other',
            output: { count: { $sum: 1 } },
          },
        },
      ]).exec(),
      
      this.enrollmentModel.countDocuments({
        ...matchStage,
        isSpecialEnrollment: true,
      }).exec(),
      
      this.enrollmentModel.aggregate([
        { $match: { ...matchStage, grade: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$grade' } } },
      ]).exec().then(result => result[0]?.avg || 0),
    ]);

    return {
      total,
      byStatus,
      byGradeRange,
      specialEnrollments,
      averageGrade: Math.round(averageGrade * 100) / 100,
    };
  }

  /**
   * Validar transición de estado
   * 
   * @param currentStatus - Estado actual
   * @param newStatus - Nuevo estado
   */
  private async validateStatusTransition(
    currentStatus: EnrollmentStatus,
    newStatus: EnrollmentStatus,
  ): Promise<void> {
    // Matriz de transiciones permitidas
    const allowedTransitions: Record<EnrollmentStatus, EnrollmentStatus[]> = {
      [EnrollmentStatus.ENROLLED]: [
        EnrollmentStatus.CANCELLED,
        EnrollmentStatus.WITHDRAWN,
        EnrollmentStatus.PASSED,
        EnrollmentStatus.FAILED,
      ],
      [EnrollmentStatus.CANCELLED]: [],
      [EnrollmentStatus.WITHDRAWN]: [],
      [EnrollmentStatus.PASSED]: [],
      [EnrollmentStatus.FAILED]: [EnrollmentStatus.ENROLLED], // Re-inscripción
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de "${currentStatus}" a "${newStatus}"`,
      );
    }
  }
}