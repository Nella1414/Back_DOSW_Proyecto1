import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum StateChangeType {
  CREATE = 'CREATE',
  STATE_CHANGE = 'STATE_CHANGE',
  UPDATE = 'UPDATE',
}

export type RequestStateHistoryDocument = RequestStateHistory & Document;

@Schema({ collection: 'request_state_history' })
export class RequestStateHistory {
  @Prop({ type: String, ref: 'ChangeRequest', required: true, index: true })
  requestId: string;

  @Prop({ required: true })
  fromState?: string; // null para CREATE

  @Prop({ required: true })
  toState: string;

  @Prop({ required: true, enum: StateChangeType })
  changeType: StateChangeType;

  @Prop({ type: String, ref: 'User' })
  actorId?: string; // Usuario que realizó el cambio

  @Prop()
  actorName?: string; // Nombre para desnormalización

  @Prop()
  reason?: string; // Razón del cambio

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Contexto adicional

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true })
  createdAt: Date;
}

export const RequestStateHistorySchema = SchemaFactory.createForClass(
  RequestStateHistory,
);

// Índice compuesto para consultas eficientes
RequestStateHistorySchema.index({ requestId: 1, timestamp: 1 });