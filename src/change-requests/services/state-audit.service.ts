import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RequestStateHistory,
  RequestStateHistoryDocument,
  StateChangeType,
} from '../entities/request-state-history.entity';
import { RequestState } from '../entities/change-request.entity';

export interface AuditStateChangeOptions {
  requestId: string;
  fromState?: RequestState;
  toState: RequestState;
  changeType: StateChangeType;
  actorId?: string;
  actorName?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * * State Audit Service
 *
 * ? Servicio responsable de registrar todos los cambios de estado
 * ? Crea eventos de auditoría automáticamente para el timeline
 * ? Proporciona trazabilidad completa de todas las transiciones
 */
@Injectable()
export class StateAuditService {
  constructor(
    @InjectModel(RequestStateHistory.name)
    private stateHistoryModel: Model<RequestStateHistoryDocument>,
  ) {}

  /**
   * * Registra un cambio de estado en el historial de auditoría
   * @param options - Opciones del cambio de estado
   * @returns Documento de historial creado
   */
  async recordStateChange(
    options: AuditStateChangeOptions,
  ): Promise<RequestStateHistoryDocument> {
    const now = new Date();

    const historyEntry = await this.stateHistoryModel.create({
      requestId: options.requestId,
      fromState: options.fromState,
      toState: options.toState,
      changeType: options.changeType,
      actorId: options.actorId,
      actorName: options.actorName,
      reason: options.reason,
      metadata: options.metadata || {},
      timestamp: now,
      createdAt: now,
    });

    return historyEntry;
  }

  /**
   * * Registra la creación inicial de una solicitud
   * @param requestId - ID de la solicitud
   * @param initialState - Estado inicial (generalmente PENDING)
   * @param actorId - ID del usuario que creó la solicitud
   * @param actorName - Nombre del actor
   * @returns Documento de historial creado
   */
  async recordCreation(
    requestId: string,
    initialState: RequestState,
    actorId?: string,
    actorName?: string,
  ): Promise<RequestStateHistoryDocument> {
    return this.recordStateChange({
      requestId,
      fromState: undefined, // No hay estado anterior en la creación
      toState: initialState,
      changeType: StateChangeType.CREATE,
      actorId,
      actorName,
      metadata: {
        event: 'REQUEST_CREATED',
        description: 'Change request was created',
      },
    });
  }

  /**
   * * Registra una transición de estado
   * @param requestId - ID de la solicitud
   * @param fromState - Estado origen
   * @param toState - Estado destino
   * @param actorId - ID del usuario que realizó el cambio
   * @param actorName - Nombre del actor
   * @param reason - Razón del cambio
   * @param additionalMetadata - Metadata adicional
   * @returns Documento de historial creado
   */
  async recordTransition(
    requestId: string,
    fromState: RequestState,
    toState: RequestState,
    actorId?: string,
    actorName?: string,
    reason?: string,
    additionalMetadata?: Record<string, any>,
  ): Promise<RequestStateHistoryDocument> {
    return this.recordStateChange({
      requestId,
      fromState,
      toState,
      changeType: StateChangeType.STATE_CHANGE,
      actorId,
      actorName,
      reason,
      metadata: {
        event: 'STATE_CHANGED',
        description: `State changed from ${fromState} to ${toState}`,
        ...additionalMetadata,
      },
    });
  }

  /**
   * * Registra una actualización de la solicitud (sin cambio de estado)
   * @param requestId - ID de la solicitud
   * @param currentState - Estado actual
   * @param actorId - ID del usuario que realizó la actualización
   * @param actorName - Nombre del actor
   * @param changes - Descripción de los cambios realizados
   * @returns Documento de historial creado
   */
  async recordUpdate(
    requestId: string,
    currentState: RequestState,
    actorId?: string,
    actorName?: string,
    changes?: string,
  ): Promise<RequestStateHistoryDocument> {
    return this.recordStateChange({
      requestId,
      fromState: currentState,
      toState: currentState,
      changeType: StateChangeType.UPDATE,
      actorId,
      actorName,
      metadata: {
        event: 'REQUEST_UPDATED',
        description: changes || 'Request information was updated',
      },
    });
  }

  /**
   * * Obtiene el historial completo de una solicitud ordenado cronológicamente
   * ? CON JOINS: Incluye información completa de actores
   * @param requestId - ID de la solicitud
   * @returns Array de eventos de historial ordenados por timestamp ASC
   */
  async getRequestHistory(
    requestId: string,
  ): Promise<RequestStateHistoryDocument[]> {
    return this.stateHistoryModel
      .find({ requestId })
      .populate('actorId', 'displayName email firstName lastName') // JOIN con usuarios
      .sort({ timestamp: 1 }) // Orden cronológico ascendente
      .exec();
  }

  /**
   * * Obtiene el último cambio de estado de una solicitud
   * @param requestId - ID de la solicitud
   * @returns Último evento de cambio de estado o null
   */
  async getLastStateChange(
    requestId: string,
  ): Promise<RequestStateHistoryDocument | null> {
    return this.stateHistoryModel
      .findOne({
        requestId,
        changeType: StateChangeType.STATE_CHANGE,
      })
      .sort({ timestamp: -1 }) // Más reciente primero
      .exec();
  }

  /**
   * * Obtiene el evento de creación de una solicitud
   * @param requestId - ID de la solicitud
   * @returns Evento de creación o null
   */
  async getCreationEvent(
    requestId: string,
  ): Promise<RequestStateHistoryDocument | null> {
    return this.stateHistoryModel
      .findOne({
        requestId,
        changeType: StateChangeType.CREATE,
      })
      .exec();
  }

  /**
   * * Obtiene estadísticas de cambios de estado de una solicitud
   * @param requestId - ID de la solicitud
   * @returns Estadísticas del historial
   */
  async getHistoryStats(requestId: string): Promise<{
    totalEvents: number;
    totalStateChanges: number;
    totalUpdates: number;
    firstEvent: Date | null;
    lastEvent: Date | null;
    uniqueActors: number;
  }> {
    const history = await this.getRequestHistory(requestId);

    const stateChanges = history.filter(
      (h) => h.changeType === StateChangeType.STATE_CHANGE,
    );
    const updates = history.filter(
      (h) => h.changeType === StateChangeType.UPDATE,
    );

    const uniqueActors = new Set(
      history.filter((h) => h.actorId).map((h) => h.actorId),
    ).size;

    return {
      totalEvents: history.length,
      totalStateChanges: stateChanges.length,
      totalUpdates: updates.length,
      firstEvent: history[0]?.timestamp || null,
      lastEvent: history[history.length - 1]?.timestamp || null,
      uniqueActors,
    };
  }

  /**
   * * Verifica si una solicitud tiene transiciones (más allá de la creación)
   * @param requestId - ID de la solicitud
   * @returns true si tiene transiciones de estado
   */
  async hasTransitions(requestId: string): Promise<boolean> {
    const count = await this.stateHistoryModel
      .countDocuments({
        requestId,
        changeType: StateChangeType.STATE_CHANGE,
      })
      .exec();

    return count > 0;
  }

  /**
   * * Obtiene el historial filtrado por tipo de cambio
   * @param requestId - ID de la solicitud
   * @param changeType - Tipo de cambio a filtrar
   * @returns Array de eventos filtrados
   */
  async getHistoryByType(
    requestId: string,
    changeType: StateChangeType,
  ): Promise<RequestStateHistoryDocument[]> {
    return this.stateHistoryModel
      .find({ requestId, changeType })
      .sort({ timestamp: 1 })
      .exec();
  }

  /**
   * * Obtiene el historial con información enriquecida para el timeline
   * @param requestId - ID de la solicitud
   * @returns Array de eventos con información adicional
   */
  async getEnrichedHistory(requestId: string): Promise<
    {
      id: string;
      requestId: string;
      fromState?: string;
      toState: string;
      changeType: string;
      actorName?: string;
      reason?: string;
      timestamp: Date;
      metadata?: Record<string, any>;
      description: string;
    }[]
  > {
    const history = await this.getRequestHistory(requestId);

    return history.map((event) => ({
      id: event.id.toString(),
      requestId: event.requestId,
      fromState: event.fromState,
      toState: event.toState,
      changeType: event.changeType,
      actorName: event.actorName || 'System',
      reason: event.reason,
      timestamp: event.timestamp,
      metadata: event.metadata,
      description: this.generateEventDescription(event),
    }));
  }

  /**
   * * Genera una descripción legible del evento
   * @private
   */
  private generateEventDescription(
    event: RequestStateHistoryDocument,
  ): string {
    switch (event.changeType) {
      case StateChangeType.CREATE:
        return `Request created in ${event.toState} state`;

      case StateChangeType.STATE_CHANGE:
        const actor = event.actorName || 'System';
        const reason = event.reason ? ` - ${event.reason}` : '';
        return `${actor} changed state from ${event.fromState} to ${event.toState}${reason}`;

      case StateChangeType.UPDATE:
        const updater = event.actorName || 'System';
        return `${updater} updated the request information`;

      default:
        return 'Event occurred';
    }
  }
  
  private generateReadableDescription(
    event: RequestStateHistoryDocument,
  ): string {
    const actor = event.actorName || 'System';

    switch (event.changeType) {
      case StateChangeType.CREATE:
        return `${actor} created the request`;

      case StateChangeType.STATE_CHANGE:
        const actionMap: Record<string, string> = {
          APPROVED: 'approved',
          REJECTED: 'rejected',
          IN_REVIEW: 'started reviewing',
          WAITING_INFO: 'requested additional information for',
          PENDING: 'moved back to pending',
        };
        const action = actionMap[event.toState] || `changed state to ${event.toState} for`;
        return `${actor} ${action} the request`;

      case StateChangeType.UPDATE:
        return `${actor} updated the request information`;

      default:
        return `${actor} performed an action`;
    }
  }
}