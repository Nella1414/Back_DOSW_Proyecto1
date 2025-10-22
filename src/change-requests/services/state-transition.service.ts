import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ValidTransition,
  ValidTransitionDocument,
} from '../entities/valid-transition.entity';
import { RequestState } from '../entities/change-request.entity';

export interface TransitionValidationResult {
  isValid: boolean;
  error?: string;
  requiresReason?: boolean;
  requiredPermissions?: string[];
}

/**
 * * State Transition Engine Service
 *
 * ? Servicio que controla y valida las transiciones de estado permitidas
 * ? Implementa el motor de transiciones con validaciones extensibles
 */
@Injectable()
export class StateTransitionService {
  // Cache en memoria para mejorar performance
  private transitionsCache: Map<string, ValidTransitionDocument> = new Map();
  private cacheInitialized = false;

  constructor(
    @InjectModel(ValidTransition.name)
    private validTransitionModel: Model<ValidTransitionDocument>,
  ) {}

  /**
   * * Valida si una transición de estado es válida
   * @param fromState - Estado origen
   * @param toState - Estado destino
   * @returns Resultado de la validación con detalles
   */
  async isValidTransition(
    fromState: RequestState,
    toState: RequestState,
  ): Promise<TransitionValidationResult> {
    // Inicializar cache si es necesario
    if (!this.cacheInitialized) {
      await this.initializeCache();
    }

    // Verificar que los estados sean diferentes
    if (fromState === toState) {
      return {
        isValid: false,
        error: 'Cannot transition to the same state',
      };
    }

    // Buscar la transición en cache
    const cacheKey = `${fromState}_${toState}`;
    const transition = this.transitionsCache.get(cacheKey);

    if (!transition) {
      return {
        isValid: false,
        error: `Transition from ${fromState} to ${toState} is not allowed`,
      };
    }

    if (!transition.isActive) {
      return {
        isValid: false,
        error: `Transition from ${fromState} to ${toState} is currently disabled`,
      };
    }

    return {
      isValid: true,
      requiresReason: transition.requiresReason,
      requiredPermissions: transition.requiredPermissions,
    };
  }

  /**
   * * Valida una transición y lanza excepción si no es válida
   * @param fromState - Estado origen
   * @param toState - Estado destino
   * @throws BadRequestException si la transición no es válida
   */
  async validateTransitionOrFail(
    fromState: RequestState,
    toState: RequestState,
  ): Promise<void> {
    const validation = await this.isValidTransition(fromState, toState);

    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }
  }

  /**
   * * Obtiene todas las transiciones válidas desde un estado dado
   * @param fromState - Estado origen
   * @returns Array de estados a los que se puede transicionar
   */
  async getAvailableTransitions(
    fromState: RequestState,
  ): Promise<
    {
      toState: string;
      description?: string;
      requiresReason?: boolean;
      requiredPermissions?: string[];
    }[]
  > {
    if (!this.cacheInitialized) {
      await this.initializeCache();
    }

    const transitions: {
      toState: string;
      description?: string;
      requiresReason?: boolean;
      requiredPermissions?: string[];
    }[] = [];

    this.transitionsCache.forEach((transition, key) => {
      if (key.startsWith(`${fromState}_`) && transition.isActive) {
        transitions.push({
          toState: transition.toState,
          description: transition.description,
          requiresReason: transition.requiresReason,
          requiredPermissions: transition.requiredPermissions,
        });
      }
    });

    return transitions;
  }

  /**
   * * Inicializa el cache de transiciones desde la base de datos
   * @private
   */
  private async initializeCache(): Promise<void> {
    const transitions = await this.validTransitionModel.find().exec();

    this.transitionsCache.clear();

    transitions.forEach((transition) => {
      const key = `${transition.fromState}_${transition.toState}`;
      this.transitionsCache.set(key, transition);
    });

    this.cacheInitialized = true;
  }

  /**
   * * Invalida el cache para forzar recarga desde BD
   * Útil después de crear/actualizar transiciones
   */
  async refreshCache(): Promise<void> {
    this.cacheInitialized = false;
    await this.initializeCache();
  }

  /**
   * * Crea una nueva transición válida
   * @param fromState - Estado origen
   * @param toState - Estado destino
   * @param options - Opciones adicionales
   */
  async createTransition(
    fromState: string,
    toState: string,
    options?: {
      description?: string;
      requiresReason?: boolean;
      requiredPermissions?: string[];
    },
  ): Promise<ValidTransitionDocument> {
    const transition = await this.validTransitionModel.create({
      fromState,
      toState,
      description: options?.description,
      requiresReason: options?.requiresReason || false,
      requiredPermissions: options?.requiredPermissions || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.refreshCache();
    return transition;
  }

  /**
   * * Obtiene todas las transiciones definidas
   */
  async getAllTransitions(): Promise<ValidTransitionDocument[]> {
    return this.validTransitionModel.find().exec();
  }
}