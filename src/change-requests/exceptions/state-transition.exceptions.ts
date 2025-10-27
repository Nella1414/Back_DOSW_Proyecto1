import { ConflictException, BadRequestException } from '@nestjs/common';

/**
 * Excepción lanzada cuando se intenta hacer una transición redundante
 * (el estado ya es el destino)
 */
export class RedundantStateTransitionException extends ConflictException {
  constructor(currentState: string, attemptedState: string) {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: `Request is already in ${currentState} state. Cannot transition to ${attemptedState}.`,
      currentState,
      attemptedState,
      type: 'REDUNDANT_TRANSITION',
    });
  }
}

/**
 * Excepción lanzada cuando se detecta un cambio concurrente
 * (el version field no coincide)
 */
export class ConcurrentModificationException extends ConflictException {
  constructor(requestId: string, expectedVersion: number) {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: `The request has been modified by another user. Please refresh and try again.`,
      requestId,
      expectedVersion,
      type: 'CONCURRENT_MODIFICATION',
      hint: 'Reload the request data and try your operation again',
    });
  }
}

/**
 * Excepción lanzada cuando se intenta una transición inválida
 */
export class InvalidStateTransitionException extends BadRequestException {
  constructor(fromState: string, toState: string, reason?: string) {
    super({
      statusCode: 400,
      error: 'Bad Request',
      message:
        reason ||
        `Cannot transition from ${fromState} to ${toState}. This transition is not allowed.`,
      fromState,
      toState,
      type: 'INVALID_TRANSITION',
    });
  }
}