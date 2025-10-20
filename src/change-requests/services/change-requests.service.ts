import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash } from 'crypto';
import { ChangeRequest, ChangeRequestDocument } from '../entities/change-request.entity';
import { CreateChangeRequestDto } from '../dto/create-change-request.dto';
import { AuditService } from '../../common/services/audit.service';
import { RadicadoService } from '../../common/services/radicado.service';
import { PriorityCalculatorService, PriorityContext } from '../../common/services/priority-calculator.service';

@Injectable()
export class ChangeRequestsService {
  constructor(
    @InjectModel(ChangeRequest.name)
    private changeRequestModel: Model<ChangeRequestDocument>,
    private auditService: AuditService,
    private radicadoService: RadicadoService,
    private priorityCalculatorService: PriorityCalculatorService,
  ) {}

  /**
   * Crea solicitud de cambio con sistema anti-duplicados
   */
  async create(
    createDto: CreateChangeRequestDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ChangeRequestDocument> {
    // Validar que origen ≠ destino
    if (createDto.sourceSubjectId === createDto.targetSubjectId) {
      throw new BadRequestException('La materia origen no puede ser igual a la materia destino');
    }

    // Generar hash anti-duplicados
    const requestHash = this.generateRequestHash(userId, createDto);

    // Verificar si ya existe solicitud duplicada
    const existingRequest = await this.changeRequestModel.findOne({ requestHash });
    if (existingRequest) {
      return existingRequest; // Retornar existente sin error
    }

    // Generar radicado único
    const radicado = await this.radicadoService.generateRadicado();

    // Calcular prioridad automáticamente
    const priorityContext: PriorityContext = {
      userId,
      sourceSubjectId: createDto.sourceSubjectId,
      targetSubjectId: createDto.targetSubjectId,
      studentSemester: await this.getStudentSemester(userId),
      isTargetMandatory: await this.isSubjectMandatory(createDto.targetSubjectId),
      isAddDropPeriod: this.priorityCalculatorService.isAddDropPeriod(),
      requestDate: new Date(),
    };

    const priority = this.priorityCalculatorService.calculatePriority(priorityContext);

    // Crear nueva solicitud
    const changeRequest = new this.changeRequestModel({
      userId,
      ...createDto,
      status: 'PENDING',
      priority,
      requestHash,
      radicado,
    });

    const savedRequest = await changeRequest.save();

    // Registrar en auditoría
    await this.auditService.logCreateEvent(
      savedRequest._id.toString(),
      userId,
      {
        entityType: 'change_request',
        sourceSubject: createDto.sourceSubjectId,
        targetSubject: createDto.targetSubjectId,
        status: 'PENDING',
      },
      ipAddress,
      userAgent,
    );

    return savedRequest;
  }

  /**
   * Genera hash estable para detectar duplicados
   */
  private generateRequestHash(userId: string, dto: CreateChangeRequestDto): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const hashInput = `${userId}:${dto.sourceSubjectId}:${dto.targetSubjectId}:${today}`;
    return createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Obtiene solicitudes del usuario
   */
  async findByUser(userId: string): Promise<ChangeRequestDocument[]> {
    return this.changeRequestModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Obtiene solicitud por ID
   */
  async findOne(id: string): Promise<ChangeRequestDocument> {
    const request = await this.changeRequestModel.findById(id);
    if (!request) {
      throw new BadRequestException('Solicitud no encontrada');
    }
    return request;
  }

  /**
   * Obtiene el semestre actual del estudiante (simulación)
   */
  private async getStudentSemester(userId: string): Promise<number> {
    // Simulación - en implementación real consultar base de datos
    // Retornar semestre aleatorio entre 1-12 para pruebas
    return Math.floor(Math.random() * 12) + 1;
  }

  /**
   * Verifica si una materia es obligatoria (simulación)
   */
  private async isSubjectMandatory(subjectId: string): Promise<boolean> {
    // Simulación - en implementación real consultar base de datos
    // Considerar obligatorias las materias que terminan en números pares
    const lastChar = subjectId.slice(-1);
    const lastDigit = parseInt(lastChar);
    return !isNaN(lastDigit) && lastDigit % 2 === 0;
  }
}