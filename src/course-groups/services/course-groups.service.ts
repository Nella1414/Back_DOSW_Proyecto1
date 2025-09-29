import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseGroup, CourseGroupDocument } from '../entities/course-group.entity';
import { Course, CourseDocument } from '../../courses/entities/course.entity';
import { AcademicPeriod, AcademicPeriodDocument } from '../../academic-periods/entities/academic-period.entity';
import { GroupSchedule, GroupScheduleDocument } from '../../group-schedules/entities/group-schedule.entity';
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from '../../enrollments/entities/enrollment.entity';
import { CreateCourseGroupDto } from '../dto/create-course-group.dto';
import { UpdateCourseGroupDto } from '../dto/update-course-group.dto';

/**
 * * Interface for available group information
 * ? Define estructura de datos para grupos disponibles con horarios
 */
export interface AvailableGroupDto {
  groupId: string;
  courseCode: string;
  courseName: string;
  groupNumber: string;
  maxStudents: number;
  currentEnrollments: number;
  availableSpots: number;
  schedule: {
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
  professorName?: string;
}

/**
 * * Course Groups Management Service
 *
 * ? Servicio bien implementado con funcionalidades completas
 * ? Maneja grupos de materias con validaciones y consultas avanzadas
 * ? Incluye logica de cupos, horarios y disponibilidad
 * TODO: Agregar validacion de capacidad de aulas
 * TODO: Implementar algoritmo de asignacion automatica de profesores
 * TODO: Agregar metricas de utilizacion de grupos
 * TODO: Implementar notificaciones de cambios a estudiantes inscritos
 */
@Injectable()
export class CourseGroupsService {
  /**
   * * Constructor injects required MongoDB models
   * @param courseGroupModel - Model for course group operations
   * @param courseModel - Model for course validation
   * @param academicPeriodModel - Model for period validation
   * @param groupScheduleModel - Model for schedule management
   * @param enrollmentModel - Model for enrollment tracking
   */
  constructor(
    @InjectModel(CourseGroup.name) private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(AcademicPeriod.name) private academicPeriodModel: Model<AcademicPeriodDocument>,
    @InjectModel(GroupSchedule.name) private groupScheduleModel: Model<GroupScheduleDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  /**
   * * Create new course group with validations
   * ? Funcion implementada con validaciones completas
   * ? Valida existencia de curso y periodo antes de crear
   * ? Previene duplicados de numero de grupo por curso/periodo
   * TODO: Agregar validacion de capacidad de aula asignada
   * TODO: Validar disponibilidad de profesor en horario
   */
  async create(createCourseGroupDto: CreateCourseGroupDto): Promise<CourseGroup> {
    // Validar que el curso existe
    const course = await this.courseModel.findById(createCourseGroupDto.courseId).exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Validar que el periodo existe
    const period = await this.academicPeriodModel.findById(createCourseGroupDto.periodId).exec();
    if (!period) {
      throw new NotFoundException('Academic period not found');
    }

    // Verificar que no existe un grupo con el mismo número para el mismo curso y periodo
    const existingGroup = await this.courseGroupModel.findOne({
      courseId: createCourseGroupDto.courseId,
      periodId: createCourseGroupDto.periodId,
      groupNumber: createCourseGroupDto.groupNumber
    }).exec();

    if (existingGroup) {
      throw new BadRequestException(
        `Group ${createCourseGroupDto.groupNumber} already exists for this course in period ${period.code}`
      );
    }

    const courseGroup = new this.courseGroupModel({
      ...createCourseGroupDto,
      currentEnrollments: 0
    });

    return await courseGroup.save();
  }

  /**
   * * Get all course groups with populated relationships
   * ? Funcion implementada correctamente
   * ? Incluye datos de curso, periodo y profesor
   * TODO: Agregar paginacion para mejor performance
   * TODO: Implementar filtros opcionales
   */
  async findAll(): Promise<CourseGroup[]> {
    return await this.courseGroupModel
      .find()
      .populate('courseId')
      .populate('periodId')
      .populate('professorId')
      .exec();
  }

  /**
   * * Get course groups by academic period
   * ? Funcion implementada con filtros basicos
   * ? Solo retorna grupos activos del periodo especificado
   * TODO: Agregar ordenamiento por curso y numero de grupo
   * TODO: Incluir estadisticas de enrollment por grupo
   */
  async findByPeriod(periodId: string): Promise<CourseGroup[]> {
    return await this.courseGroupModel
      .find({ periodId, isActive: true })
      .populate('courseId')
      .populate('periodId')
      .populate('professorId')
      .exec();
  }

  /**
   * * Get course groups by course and optionally by period
   * ? Funcion implementada con filtros dinamicos
   * ? Permite buscar grupos de una materia especifica
   * TODO: Agregar filtro por disponibilidad de cupos
   * TODO: Incluir informacion de horarios en response
   */
  async findByCourse(courseId: string, periodId?: string): Promise<CourseGroup[]> {
    const query: any = { courseId, isActive: true };
    if (periodId) {
      query.periodId = periodId;
    }

    return await this.courseGroupModel
      .find(query)
      .populate('courseId')
      .populate('periodId')
      .populate('professorId')
      .exec();
  }

  /**
   * * Get available groups with enrollment information
   * ? Funcion implementada con logica compleja de disponibilidad
   * ? Calcula cupos disponibles y incluye horarios
   * TODO: Agregar cache para consultas frecuentes
   * TODO: Implementar filtros adicionales por dia/hora
   */
  async getAvailableGroups(
    courseId?: string,
    periodId?: string
  ): Promise<AvailableGroupDto[]> {
    const query: any = { isActive: true };
    if (courseId) query.courseId = courseId;
    if (periodId) query.periodId = periodId;

    const groups = await this.courseGroupModel
      .find(query)
      .populate('courseId')
      .populate('periodId')
      .exec();

    const availableGroups: AvailableGroupDto[] = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const group of groups) {
      // Obtener enrollments actuales
      const currentEnrollments = await this.enrollmentModel.countDocuments({
        groupId: group._id,
        status: EnrollmentStatus.ENROLLED
      }).exec();

      // Actualizar contador si es diferente
      if (currentEnrollments !== group.currentEnrollments) {
        await this.courseGroupModel.updateOne(
          { _id: group._id },
          { currentEnrollments }
        ).exec();
        group.currentEnrollments = currentEnrollments;
      }

      // Solo incluir grupos con cupos disponibles
      if (currentEnrollments < group.maxStudents) {
        // Obtener horarios
        const schedules = await this.groupScheduleModel
          .find({ groupId: group._id })
          .exec();

        const groupSchedules = schedules.map(schedule => ({
          dayOfWeek: schedule.dayOfWeek,
          dayName: daysOfWeek[schedule.dayOfWeek] || 'Desconocido',
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room
        }));

        availableGroups.push({
          groupId: group._id as string,
          courseCode: (group.courseId as any).code,
          courseName: (group.courseId as any).name,
          groupNumber: group.groupNumber,
          maxStudents: group.maxStudents,
          currentEnrollments: currentEnrollments,
          availableSpots: group.maxStudents - currentEnrollments,
          schedule: groupSchedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
          professorName: group.professorId ? 'Por asignar' : undefined
        });
      }
    }

    return availableGroups.sort((a, b) =>
      a.courseCode.localeCompare(b.courseCode) ||
      a.groupNumber.localeCompare(b.groupNumber)
    );
  }

  async findOne(id: string): Promise<CourseGroup> {
    const group = await this.courseGroupModel
      .findById(id)
      .populate('courseId')
      .populate('periodId')
      .populate('professorId')
      .exec();

    if (!group) {
      throw new NotFoundException('Course group not found');
    }

    return group;
  }

  async update(id: string, updateCourseGroupDto: UpdateCourseGroupDto): Promise<CourseGroup> {
    const group = await this.courseGroupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Course group not found');
    }

    // Si se está cambiando el curso o periodo, validar que no haya conflictos
    if (updateCourseGroupDto.courseId || updateCourseGroupDto.periodId || updateCourseGroupDto.groupNumber) {
      const courseId = updateCourseGroupDto.courseId || group.courseId;
      const periodId = updateCourseGroupDto.periodId || group.periodId;
      const groupNumber = updateCourseGroupDto.groupNumber || group.groupNumber;

      const existingGroup = await this.courseGroupModel.findOne({
        _id: { $ne: id },
        courseId,
        periodId,
        groupNumber
      }).exec();

      if (existingGroup) {
        throw new BadRequestException(
          `Group ${groupNumber} already exists for this course in the specified period`
        );
      }
    }

    Object.assign(group, updateCourseGroupDto);
    return await group.save();
  }

  async remove(id: string): Promise<void> {
    const group = await this.courseGroupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Course group not found');
    }

    // Verificar que no hay estudiantes inscritos
    const enrollmentCount = await this.enrollmentModel.countDocuments({
      groupId: id,
      status: EnrollmentStatus.ENROLLED
    }).exec();

    if (enrollmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete a group that has enrolled students'
      );
    }

    // Eliminar horarios asociados
    await this.groupScheduleModel.deleteMany({ groupId: id }).exec();

    // Eliminar el grupo
    await this.courseGroupModel.findByIdAndDelete(id).exec();
  }

  async updateEnrollmentCount(groupId: string): Promise<void> {
    const currentEnrollments = await this.enrollmentModel.countDocuments({
      groupId,
      status: EnrollmentStatus.ENROLLED
    }).exec();

    await this.courseGroupModel.updateOne(
      { _id: groupId },
      { currentEnrollments }
    ).exec();
  }

  async getGroupsByStudent(studentId: string, periodId?: string): Promise<CourseGroup[]> {
    const query: any = {
      studentId,
      status: EnrollmentStatus.ENROLLED
    };

    const enrollments = await this.enrollmentModel.find(query).exec();
    const groupIds = enrollments.map(e => e.groupId);

    const groupQuery: any = { _id: { $in: groupIds } };
    if (periodId) {
      groupQuery.periodId = periodId;
    }

    return await this.courseGroupModel
      .find(groupQuery)
      .populate('courseId')
      .populate('periodId')
      .exec();
  }
}