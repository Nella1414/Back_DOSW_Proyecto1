import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateWaitlistDto } from '../dto/create-waitlist.dto';
import { UpdateWaitlistDto } from '../dto/update-waitlist.dto';
import { QueryWaitlistDto } from '../dto/query-waitlist.dto';
import {
  GroupWaitlist,
  WaitlistDocument,
  WaitlistStatus,
} from '../entities/waitlist.entity';
import {
  Student,
  StudentDocument,
} from '../../students/entities/student.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../../course-groups/entities/course-group.entity';

/**
 * Waitlists Management Service
 *
 * Servicio completo para gestión de listas de espera.
 * Incluye procesamiento automático, reordenamiento y notificaciones.
 */
@Injectable()
export class WaitlistsService {
  constructor(
    @InjectModel(GroupWaitlist.name)
    private waitlistModel: Model<WaitlistDocument>,
    @InjectModel(Student.name)
    private studentModel: Model<StudentDocument>,
    @InjectModel(CourseGroup.name)
    private courseGroupModel: Model<CourseGroupDocument>,
  ) {}

  /**
   * Agregar estudiante a lista de espera
   * 
   * Validaciones:
   * - Grupo debe estar lleno
   * - Estudiante no debe estar ya en la lista
   * - Calcula posición automáticamente
   * 
   * @param createWaitlistDto - Datos de la solicitud
   * @returns Entrada en waitlist creada
   */
  async create(createWaitlistDto: CreateWaitlistDto): Promise<GroupWaitlist> {
    // 1. Validar que el estudiante existe
    const student = await this.studentModel
      .findById(createWaitlistDto.studentId)
      .exec();
    
    if (!student) {
      throw new NotFoundException(
        `Estudiante con ID "${createWaitlistDto.studentId}" no encontrado`,
      );
    }

    // 2. Validar que el grupo existe
    const group = await this.courseGroupModel
      .findById(createWaitlistDto.groupId)
      .populate('courseId')
      .exec();
    
    if (!group) {
      throw new NotFoundException(
        `Grupo con ID "${createWaitlistDto.groupId}" no encontrado`,
      );
    }

    // 3. Validar que el grupo está lleno
    // TODO: Descomentar cuando se implemente enrollments
    /*
    const currentEnrollments = await this.enrollmentModel
      .countDocuments({
        groupId: createWaitlistDto.groupId,
        status: EnrollmentStatus.ENROLLED,
      })
      .exec();

    if (currentEnrollments < group.maxCapacity) {
      throw new BadRequestException(
        `El grupo aún tiene cupos disponibles (${currentEnrollments}/${group.maxCapacity})`,
      );
    }
    */

    // 4. Validar que el estudiante no está ya en la waitlist activa
    const existingWaitlist = await this.waitlistModel
      .findOne({
        groupId: createWaitlistDto.groupId,
        studentId: createWaitlistDto.studentId,
        status: { $in: [WaitlistStatus.WAITING, WaitlistStatus.ADMITTED] },
      })
      .exec();

    if (existingWaitlist) {
      throw new ConflictException(
        `El estudiante ya está en la lista de espera de este grupo (posición ${existingWaitlist.position})`,
      );
    }

    // 5. Calcular posición en la lista
    const position = await this.calculateNextPosition(
      createWaitlistDto.groupId,
      createWaitlistDto.priority || 0,
    );

    // 6. Crear entrada en waitlist
    const waitlist = new this.waitlistModel({
      groupId: new Types.ObjectId(createWaitlistDto.groupId),
      studentId: new Types.ObjectId(createWaitlistDto.studentId),
      academicPeriodId: new Types.ObjectId(createWaitlistDto.academicPeriodId),
      position,
      priority: createWaitlistDto.priority || 0,
      status: WaitlistStatus.WAITING,
      notes: createWaitlistDto.notes,
    });

    return waitlist.save();
  }

  /**
   * Listar entradas de waitlist con filtros
   * 
   * @param queryDto - Parámetros de consulta y filtros
   * @returns Lista paginada de entradas
   */
  async findAll(queryDto: QueryWaitlistDto): Promise<{
    data: GroupWaitlist[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      groupId,
      studentId,
      academicPeriodId,
      status,
      minPriority,
      sortBy = 'position',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = queryDto;

    // Construir filtros
    const filters: any = {};

    if (groupId) {
      filters.groupId = new Types.ObjectId(groupId);
    }

    if (studentId) {
      filters.studentId = new Types.ObjectId(studentId);
    }

    if (academicPeriodId) {
      filters.academicPeriodId = new Types.ObjectId(academicPeriodId);
    }

    if (status) {
      filters.status = status;
    }

    if (minPriority !== undefined) {
      filters.priority = { $gte: minPriority };
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Ordenamiento
    const sortOptions: any = {};
    // Orden especial: primero por prioridad (desc), luego por posición/createdAt
    if (sortBy === 'position') {
      sortOptions.priority = -1; // Mayor prioridad primero
      sortOptions.position = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Ejecutar consulta
    const [data, total] = await Promise.all([
      this.waitlistModel
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
      this.waitlistModel.countDocuments(filters).exec(),
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
   * Obtener entrada de waitlist por ID
   * 
   * @param id - ID de la entrada
   * @returns Entrada encontrada
   */
  async findOne(id: string): Promise<GroupWaitlist> {
    const waitlist = await this.waitlistModel
      .findById(id)
      .populate('studentId')
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .populate('academicPeriodId')
      .exec();

    if (!waitlist) {
      throw new NotFoundException(
        `Entrada de waitlist con ID "${id}" no encontrada`,
      );
    }

    return waitlist;
  }

  /**
   * Obtener waitlist de un grupo específico
   * 
   * @param groupId - ID del grupo
   * @returns Lista de espera del grupo ordenada
   */
  async findByGroup(groupId: string): Promise<GroupWaitlist[]> {
    const group = await this.courseGroupModel.findById(groupId).exec();
    
    if (!group) {
      throw new NotFoundException(`Grupo con ID "${groupId}" no encontrado`);
    }

    return this.waitlistModel
      .find({ 
        groupId: new Types.ObjectId(groupId),
        status: WaitlistStatus.WAITING
      })
      .populate('studentId')
      .sort({ priority: -1, position: 1 })
      .exec();
  }

  /**
   * Obtener waitlists de un estudiante
   * 
   * @param studentId - ID del estudiante
   * @returns Lista de esperas del estudiante
   */
  async findByStudent(studentId: string): Promise<GroupWaitlist[]> {
    const student = await this.studentModel.findById(studentId).exec();
    
    if (!student) {
      throw new NotFoundException(
        `Estudiante con ID "${studentId}" no encontrado`,
      );
    }

    return this.waitlistModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .populate('academicPeriodId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Actualizar entrada de waitlist
   * 
   * @param id - ID de la entrada
   * @param updateWaitlistDto - Datos a actualizar
   * @returns Entrada actualizada
   */
  async update(
    id: string,
    updateWaitlistDto: UpdateWaitlistDto,
  ): Promise<GroupWaitlist> {
    // 1. Verificar que existe
    const existingWaitlist = await this.findOne(id);

    // 2. Validar transición de estado si se proporciona
    if (updateWaitlistDto.status) {
      await this.validateStatusTransition(
        existingWaitlist.status,
        updateWaitlistDto.status as WaitlistStatus,
      );
    }

    // 3. Actualizar
    const updatedWaitlist = await this.waitlistModel
      .findByIdAndUpdate(
        id,
        updateWaitlistDto,
        { new: true, runValidators: true },
      )
      .populate('studentId')
      .populate({
        path: 'groupId',
        populate: { path: 'courseId' },
      })
      .populate('academicPeriodId')
      .exec();

    if (!updatedWaitlist) {
      throw new NotFoundException(
        `Entrada de waitlist con ID "${id}" no encontrada`,
      );
    }

    // 4. Si cambió a WITHDRAWN o EXPIRED, reordenar
    if ([WaitlistStatus.WITHDRAWN, WaitlistStatus.EXPIRED].includes(updatedWaitlist.status)) {
      await this.reorderPositions(updatedWaitlist.groupId.toString());
    }

    return updatedWaitlist;
  }

  /**
   * Eliminar entrada de waitlist
   * 
   * @param id - ID de la entrada
   * @returns Confirmación de eliminación
   */
  async remove(id: string): Promise<{ message: string; waitlist: GroupWaitlist }> {
  // 1. Verificar que existe
  const waitlist = await this.findOne(id);

  // 2. Marcar como withdrawn (soft delete)
  const deletedWaitlist = await this.waitlistModel
    .findByIdAndUpdate(
      id,
      {
        status: WaitlistStatus.WITHDRAWN,
        withdrawnAt: new Date(),
        withdrawalReason: 'Eliminación por solicitud',
      },
      { new: true },
    )
    .exec();

  if (!deletedWaitlist) {
    throw new NotFoundException(`Entrada de waitlist con ID "${id}" no encontrada`);
  }

  // 3. Reordenar posiciones
  await this.reorderPositions(waitlist.groupId.toString());

  return {
    message: 'Entrada eliminada y posiciones reordenadas',
    waitlist: deletedWaitlist,
  };
}


  /**
   * Admitir siguiente estudiante en la lista
   * 
   * @param groupId - ID del grupo
   * @returns Estudiante admitido
   */
  async admitNext(groupId: string): Promise<GroupWaitlist> {
    // 1. Buscar el primer estudiante en espera (mayor prioridad, menor posición)
    const nextInLine = await this.waitlistModel
      .findOne({
        groupId: new Types.ObjectId(groupId),
        status: WaitlistStatus.WAITING,
      })
      .sort({ priority: -1, position: 1 })
      .exec();

    if (!nextInLine) {
      throw new NotFoundException('No hay estudiantes en espera para este grupo');
    }

    // 2. Cambiar estado a ADMITTED
    nextInLine.status = WaitlistStatus.ADMITTED;
    nextInLine.admittedAt = new Date();
    nextInLine.responseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 horas

    return nextInLine.save();
  }

  /**
   * Procesar lista de espera automáticamente
   * 
   * Busca cupos disponibles y admite estudiantes
   * 
   * @param groupId - ID del grupo
   * @returns Número de estudiantes admitidos
   */
  async processWaitlist(groupId: string): Promise<{
    admitted: number;
    students: GroupWaitlist[];
  }> {
    // TODO: Implementar cuando se tenga módulo de enrollments
    // Por ahora retornamos estructura base
    
    const waitingStudents = await this.findByGroup(groupId);
    const admitted: GroupWaitlist[] = [];

    // Lógica pendiente: verificar cupos disponibles y admitir estudiantes
    
    return {
      admitted: admitted.length,
      students: admitted,
    };
  }

  /**
   * Expirar entradas que pasaron el deadline
   * 
   * @returns Número de entradas expiradas
   */
  async expireDeadlines(): Promise<number> {
    const result = await this.waitlistModel
      .updateMany(
        {
          status: WaitlistStatus.ADMITTED,
          responseDeadline: { $lt: new Date() },
        },
        {
          status: WaitlistStatus.EXPIRED,
          withdrawnAt: new Date(),
          withdrawalReason: 'Expiración por falta de respuesta',
        },
      )
      .exec();

    return result.modifiedCount;
  }

  /**
   * Obtener estadísticas de waitlists
   * 
   * @param groupId - ID del grupo (opcional)
   * @returns Estadísticas de listas de espera
   */
  async getStatistics(groupId?: string): Promise<{
    total: number;
    byStatus: any[];
    averageWaitTime: number;
    byPriority: any[];
  }> {
    const matchStage: any = {};
    if (groupId) {
      matchStage.groupId = new Types.ObjectId(groupId);
    }

    const [total, byStatus, byPriority, waitTimes] = await Promise.all([
      this.waitlistModel.countDocuments(matchStage).exec(),
      
      this.waitlistModel.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).exec(),
      
      this.waitlistModel.aggregate([
        { $match: matchStage },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]).exec(),
      
      this.waitlistModel.aggregate([
        { 
          $match: { 
            ...matchStage, 
            status: { $in: [WaitlistStatus.ADMITTED, WaitlistStatus.WITHDRAWN] },
            withdrawnAt: { $exists: true }
          } 
        },
        {
          $project: {
            waitTime: {
              $divide: [
                { $subtract: ['$withdrawnAt', '$createdAt'] },
                1000 * 60 * 60 * 24 // Convertir a días
              ]
            }
          }
        },
        { $group: { _id: null, avg: { $avg: '$waitTime' } } },
      ]).exec(),
    ]);

    return {
      total,
      byStatus,
      averageWaitTime: waitTimes[0]?.avg || 0,
      byPriority,
    };
  }

  /**
   * Calcular siguiente posición en la lista
   * 
   * @param groupId - ID del grupo
   * @param priority - Prioridad del estudiante
   * @returns Posición calculada
   */
  private async calculateNextPosition(
    groupId: string,
    priority: number,
  ): Promise<number> {
    // Buscar la última posición de estudiantes con la misma prioridad
    const lastWithSamePriority = await this.waitlistModel
      .findOne({
        groupId: new Types.ObjectId(groupId),
        priority,
        status: WaitlistStatus.WAITING,
      })
      .sort({ position: -1 })
      .exec();

    if (lastWithSamePriority) {
      return lastWithSamePriority.position + 1;
    }

    // Si no hay nadie con la misma prioridad, buscar el último en general
    const lastInList = await this.waitlistModel
      .findOne({
        groupId: new Types.ObjectId(groupId),
        status: WaitlistStatus.WAITING,
      })
      .sort({ position: -1 })
      .exec();

    return lastInList ? lastInList.position + 1 : 1;
  }

  /**
   * Reordenar posiciones después de eliminar una entrada
   * 
   * @param groupId - ID del grupo
   */
  private async reorderPositions(groupId: string): Promise<void> {
    // Obtener todas las entradas activas ordenadas por prioridad y posición
    const activeEntries = await this.waitlistModel
      .find({
        groupId: new Types.ObjectId(groupId),
        status: WaitlistStatus.WAITING,
      })
      .sort({ priority: -1, position: 1 })
      .exec();

    // Reordenar posiciones
    const updatePromises = activeEntries.map((entry, index) => {
      return this.waitlistModel
        .findByIdAndUpdate(entry._id, { position: index + 1 })
        .exec();
    });

    await Promise.all(updatePromises);
  }

  /**
   * Validar transición de estado
   * 
   * @param currentStatus - Estado actual
   * @param newStatus - Nuevo estado
   */
  private async validateStatusTransition(
    currentStatus: WaitlistStatus,
    newStatus: WaitlistStatus,
  ): Promise<void> {
    // Matriz de transiciones permitidas
    const allowedTransitions: Record<WaitlistStatus, WaitlistStatus[]> = {
      [WaitlistStatus.WAITING]: [
        WaitlistStatus.ADMITTED,
        WaitlistStatus.WITHDRAWN,
        WaitlistStatus.EXPIRED,
      ],
      [WaitlistStatus.ADMITTED]: [
        WaitlistStatus.WITHDRAWN,
        WaitlistStatus.EXPIRED,
      ],
      [WaitlistStatus.WITHDRAWN]: [],
      [WaitlistStatus.EXPIRED]: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de "${currentStatus}" a "${newStatus}"`,
      );
    }
  }
}