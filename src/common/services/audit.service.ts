import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AuditRequest,
  AuditRequestDocument,
} from '../entities/audit-request.entity';

export interface AuditEventData {
  requestId: string;
  eventType:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'APPROVE'
    | 'REJECT'
    | 'RADICATE'
    | 'ROUTE'
    | 'FALLBACK'
    | 'ROUTE_ASSIGNED';
  actorId: string;
  requestDetails?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sourceData?: Record<string, any>;
  targetData?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditRequest.name)
    private auditModel: Model<AuditRequestDocument>,
  ) {}

  /**
   * Registra evento de auditoría
   */
  async logEvent(eventData: AuditEventData): Promise<AuditRequestDocument> {
    try {
      this.logger.debug(
        `Registrando evento de auditoría: ${eventData.eventType} para solicitud ${eventData.requestId}`,
      );

      const auditEntry = new this.auditModel({
        ...eventData,
        timestamp: new Date(),
      });

      const savedEntry = await auditEntry.save();

      // Log eventos críticos
      if (this.isCriticalEvent(eventData.eventType)) {
        this.logger.warn(
          `Evento crítico de auditoría registrado: ${eventData.eventType} - Solicitud: ${eventData.requestId} - Actor: ${eventData.actorId}`,
        );
      }

      this.logger.debug(
        `Evento de auditoría registrado exitosamente: ID ${savedEntry._id}`,
      );
      return savedEntry;
    } catch (error) {
      this.logger.error(
        `Error registrando evento de auditoría [${eventData.eventType}] para solicitud ${eventData.requestId}: ${error.message}`,
        error.stack,
      );
      // No lanzar error para no interrumpir el flujo principal
      // La auditoría es importante pero no debe detener operaciones críticas
      throw error;
    }
  }

  /**
   * Determina si un evento es crítico y requiere atención especial
   */
  private isCriticalEvent(eventType: AuditEventData['eventType']): boolean {
    const criticalEvents: AuditEventData['eventType'][] = [
      'DELETE',
      'APPROVE',
      'REJECT',
      'FALLBACK',
    ];
    return criticalEvents.includes(eventType);
  }

  /**
   * Registra evento CREATE automáticamente
   */
  async logCreateEvent(
    requestId: string,
    actorId: string,
    requestDetails: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditRequestDocument> {
    try {
      return await this.logEvent({
        requestId,
        eventType: 'CREATE',
        actorId,
        requestDetails,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      this.logger.error(
        `Error en logCreateEvent para solicitud ${requestId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Registra evento RADICATE automáticamente
   */
  async logRadicateEvent(
    requestId: string,
    radicado: string,
    priority: string,
    priorityCriteria: Record<string, any>,
  ): Promise<AuditRequestDocument> {
    try {
      this.logger.log(
        `Radicación: ${radicado} asignado a solicitud ${requestId} con prioridad ${priority}`,
      );

      return await this.logEvent({
        requestId,
        eventType: 'RADICATE',
        actorId: 'system',
        requestDetails: {
          entityType: 'radicado_assignment',
          radicado,
          priority,
          priorityCriteria,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error en logRadicateEvent para solicitud ${requestId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Registra evento ROUTE automáticamente
   */
  async logRouteEvent(
    requestId: string,
    assignedProgramId: string,
    routingDecision: Record<string, any>,
  ): Promise<AuditRequestDocument> {
    try {
      return await this.logEvent({
        requestId,
        eventType: 'ROUTE',
        actorId: 'system',
        requestDetails: {
          entityType: 'program_assignment',
          assignedProgramId,
          routingDecision,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error en logRouteEvent para solicitud ${requestId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Registra evento FALLBACK cuando se usa programa por defecto
   */
  async logFallbackEvent(
    requestId: string,
    originalProgramId: string,
    fallbackProgramId: string,
    reason: string,
  ): Promise<AuditRequestDocument> {
    try {
      this.logger.warn(
        `Fallback aplicado en solicitud ${requestId}: ${originalProgramId} -> ${fallbackProgramId}. Razón: ${reason}`,
      );

      return await this.logEvent({
        requestId,
        eventType: 'FALLBACK',
        actorId: 'system',
        requestDetails: {
          entityType: 'program_fallback',
          originalProgramId,
          fallbackProgramId,
          reason,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error en logFallbackEvent para solicitud ${requestId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Registra evento ROUTE_ASSIGNED con detalles completos
   */
  async logRouteAssignedEvent(
    requestId: string,
    finalProgramId: string,
    routingDecision: Record<string, any>,
    validationResult: Record<string, any>,
    troubleshootingInfo: Record<string, any>,
  ): Promise<AuditRequestDocument> {
    try {
      return await this.logEvent({
        requestId,
        eventType: 'ROUTE_ASSIGNED',
        actorId: 'system',
        requestDetails: {
          entityType: 'route_assignment',
          finalProgramId,
          routingDecision,
          validationResult,
          troubleshootingInfo,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error en logRouteAssignedEvent para solicitud ${requestId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Obtiene historial de auditoría por solicitud
   */
  async getAuditHistory(requestId: string): Promise<AuditRequestDocument[]> {
    try {
      this.logger.debug(
        `Consultando historial de auditoría para solicitud ${requestId}`,
      );

      const history = await this.auditModel
        .find({ requestId })
        .sort({ timestamp: -1 })
        .exec();

      this.logger.debug(
        `Encontrados ${history.length} eventos de auditoría para solicitud ${requestId}`,
      );
      return history;
    } catch (error) {
      this.logger.error(
        `Error obteniendo historial de auditoría para solicitud ${requestId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
