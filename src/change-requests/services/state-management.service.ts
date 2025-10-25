import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChangeRequest,
  ChangeRequestDocument,
  RequestState,
} from '../entities/change-request.entity';
import { StateTransitionService } from './state-transition.service';
import { StateAuditService } from './state-audit.service';
import { StateChangeType } from '../entities/request-state-history.entity';
import {
  RedundantStateTransitionException,
  ConcurrentModificationException,
  InvalidStateTransitionException,
} from '../exceptions/state-transition.exceptions';

export interface StateChangeOptions {
  actorId?: string;
  actorName?: string;
  reason?: string;
  observations?: string;
  metadata?: Record<string, any>;
}

export interface StateChangeResult {
  success: boolean;
  previousState: RequestState;
  newState: RequestState;
  version: number;
  changedAt: Date;
  changedBy?: string;
}

/**
 * * State Management Service
 *
 * ? Servicio que gestiona los cambios de estado con:
 * ? - Idempotencia (evita cambios duplicados)
 * ? - Control de concurrencia optimista (version field)
 * ? - Validación de transiciones
 */
@Injectable()
export class StateManagementService {
  constructor(
    @InjectModel(ChangeRequest.name)
    private changeRequestModel: Model<ChangeRequestDocument>,
    private stateTransitionService: StateTransitionService,
  ) {}

  /**
   * * Cambia el estado de una solicitud con todas las validaciones
   * @param requestId - ID de la solicitud
   * @param toState - Estado destino
   * @param options - Opciones adicionales (actor, razón, etc.)
   * @param expectedVersion - Versión esperada para control de concurrencia
   * @returns Resultado del cambio de estado
   * @throws RedundantStateTransitionException si ya está en ese estado
   * @throws ConcurrentModificationException si hay cambio concurrente
   * @throws InvalidStateTransitionException si la transición no es válida
   */
  async changeState(
    requestId: string,
    toState: RequestState,
    options: StateChangeOptions = {},
    expectedVersion?: number,
  ): Promise<StateChangeResult> {
    // 1. Obtener la solicitud actual
    const request = await this.changeRequestModel.findById(requestId).exec();

    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    const currentState = request.state;

    // 2. IDEMPOTENCIA: Verificar si ya está en el estado destino
    if (currentState === toState) {
      throw new RedundantStateTransitionException(currentState, toState);
    }

    // 3. CONTROL DE CONCURRENCIA: Verificar versión si se proporciona
    if (expectedVersion !== undefined && request.version !== expectedVersion) {
      throw new ConcurrentModificationException(requestId, expectedVersion);
    }

    // 4. Validar que la transición sea permitida
    const validation = await this.stateTransitionService.isValidTransition(
      currentState,
      toState,
    );

    if (!validation.isValid) {
      throw new InvalidStateTransitionException(
        currentState,
        toState,
        validation.error,
      );
    }

    // 5. Verificar si se requiere razón y no se proporcionó
    if (validation.requiresReason && !options.reason) {
      throw new InvalidStateTransitionException(
        currentState,
        toState,
        `Transition from ${currentState} to ${toState} requires a reason`,
      );
    }

    // 6. Ejecutar el cambio de estado con bloqueo optimista
    const updateResult = await this.changeRequestModel
      .findOneAndUpdate(
        {
          _id: requestId,
          version: request.version, // Condición de versión para bloqueo optimista
        },
        {
          $set: {
            state: toState,
            lastStateChangedBy: options.actorId,
            lastStateChangedAt: new Date(),
            updatedAt: new Date(),
            // Si es un estado final, registrar la resolución
            ...(toState === RequestState.APPROVED ||
            toState === RequestState.REJECTED
              ? {
                  resolvedAt: new Date(),
                  resolutionReason: options.reason,
                }
              : {}),
            // Agregar observaciones si se proporcionan
            ...(options.observations
              ? {
                  observations:
                    (request.observations || '') + '\n' + options.observations,
                }
              : {}),
          },
          $inc: { version: 1 }, // Incrementar versión
        },
        { new: true }, // Devolver el documento actualizado
      )
      .exec();

    // 7. Verificar si el update fue exitoso (puede fallar por cambio concurrente)
    if (!updateResult) {
      throw new ConcurrentModificationException(requestId, request.version);
    }

    // 8. Devolver resultado exitoso
    return {
      success: true,
      previousState: currentState,
      newState: toState,
      version: updateResult.version,
      changedAt: updateResult.lastStateChangedAt!,
      changedBy: options.actorName || options.actorId,
    };
  }

  /**
   * * Verifica si una solicitud está en un estado específico
   * @param requestId - ID de la solicitud
   * @param expectedState - Estado esperado
   * @returns true si está en el estado esperado
   */
  async isInState(
    requestId: string,
    expectedState: RequestState,
  ): Promise<boolean> {
    const request = await this.changeRequestModel
      .findById(requestId)
      .select('state')
      .exec();

    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    return request.state === expectedState;
  }

  /**
   * * Obtiene el estado actual de una solicitud junto con su versión
   * @param requestId - ID de la solicitud
   * @returns Estado actual y versión
   */
  async getCurrentState(
    requestId: string,
  ): Promise<{ state: RequestState; version: number }> {
    const request = await this.changeRequestModel
      .findById(requestId)
      .select('state version')
      .exec();

    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    return {
      state: request.state,
      version: request.version,
    };
  }

  /**
   * * Obtiene las transiciones disponibles desde el estado actual
   * @param requestId - ID de la solicitud
   * @returns Array de transiciones disponibles
   */
  async getAvailableTransitionsForRequest(requestId: string): Promise<
    {
      toState: string;
      description?: string;
      requiresReason?: boolean;
      requiredPermissions?: string[];
    }[]
  > {
    const request = await this.changeRequestModel
      .findById(requestId)
      .select('state')
      .exec();

    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    return this.stateTransitionService.getAvailableTransitions(request.state);
  }

  /**
   * * Intenta cambiar el estado, pero no falla si ya está en ese estado
   * Útil para operaciones idempotentes que no deben fallar
   * @param requestId - ID de la solicitud
   * @param toState - Estado destino
   * @param options - Opciones adicionales
   * @returns Resultado del cambio o null si ya estaba en ese estado
   */
  async changeStateIdempotent(
    requestId: string,
    toState: RequestState,
    options: StateChangeOptions = {},
  ): Promise<StateChangeResult | null> {
    try {
      return await this.changeState(requestId, toState, options);
    } catch (error) {
      if (error instanceof RedundantStateTransitionException) {
        // Ya está en el estado deseado, esto es OK para operaciones idempotentes
        const currentStateInfo = await this.getCurrentState(requestId);
        return null; // Indica que no se hizo cambio porque ya estaba en ese estado
      }
      // Re-lanzar cualquier otro error
      throw error;
    }
  }
}