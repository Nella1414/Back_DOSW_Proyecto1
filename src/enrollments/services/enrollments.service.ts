import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from '../entities/enrollment.entity';
import { Student, StudentDocument } from '../../students/entities/student.entity';
import { CourseGroup, CourseGroupDocument } from '../../course-groups/entities/course-group.entity';

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
  /**
   * * Constructor injects required MongoDB models
   * @param enrollmentModel - Mongoose model for Enrollment operations
   * @param studentModel - Mongoose model for Student lookup
   * @param courseGroupModel - Mongoose model for CourseGroup validation
   */
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(CourseGroup.name) private courseGroupModel: Model<CourseGroupDocument>,
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
    const student = await this.studentModel.findOne({ code: createEnrollmentDto.studentId });
    if (!student) {
      throw new NotFoundException(`Student with ID ${createEnrollmentDto.studentId} not found`);
    }

    const group = await this.courseGroupModel.findById(createEnrollmentDto.groupId).populate('courseId');
    if (!group) {
      throw new NotFoundException(`Course group with ID ${createEnrollmentDto.groupId} not found`);
    }

    const existingEnrollment = await this.enrollmentModel.findOne({
      studentId: student._id,
      groupId: createEnrollmentDto.groupId,
      status: { $in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.PASSED] }
    });

    if (existingEnrollment) {
      throw new BadRequestException('Student is already enrolled in this course group');
    }

    const enrollment = new this.enrollmentModel({
      studentId: student._id,
      groupId: createEnrollmentDto.groupId,
      enrolledAt: new Date(),
      status: createEnrollmentDto.status || EnrollmentStatus.ENROLLED,
      grade: createEnrollmentDto.grade
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
        populate: { path: 'courseId' }
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
        populate: { path: 'courseId' }
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
        populate: { path: 'courseId' }
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
  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel.findByIdAndUpdate(
      id,
      updateEnrollmentDto,
      { new: true }
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
  async enrollStudentInCourse(studentCode: string, groupId: string): Promise<Enrollment> {
    return this.create({
      studentId: studentCode,
      groupId,
      status: EnrollmentStatus.ENROLLED
    });
  }
}
