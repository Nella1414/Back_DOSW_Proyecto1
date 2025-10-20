import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditRequest, AuditRequestDocument } from '../entities/audit-request.entity';

export interface AuditEventData {
  requestId: string;
  eventType: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'RADICATE';
  actorId: string;
  requestDetails?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sourceData?: Record<string, any>;
  targetData?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditRequest.name)
    private auditModel: Model<AuditRequestDocument>,
  ) {}

  /**
   * Registra evento de auditoría
   */
  async logEvent(eventData: AuditEventData): Promise<AuditRequestDocument> {
    const auditEntry = new this.auditModel({
      ...eventData,
      timestamp: new Date(),
    });

    return auditEntry.save();
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
    return this.logEvent({
      requestId,
      eventType: 'CREATE',
      actorId,
      requestDetails,
      ipAddress,
      userAgent,
    });
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
    return this.logEvent({
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
  }

  /**
   * Obtiene historial de auditoría por solicitud
   */
  async getAuditHistory(requestId: string): Promise<AuditRequestDocument[]> {
    return this.auditModel
      .find({ requestId })
      .sort({ timestamp: -1 })
      .exec();
  }
}