import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum RequestState {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITING_INFO = 'WAITING_INFO',
  IN_REVIEW = 'IN_REVIEW',
}

export type ChangeRequestDocument = ChangeRequest & Document;

@Schema()
export class ChangeRequest {
  @Prop({ required: true, unique: true })
  radicado: string;

  @Prop({ type: String, ref: 'Student', required: true })
  studentId: string;

  @Prop({ type: String, ref: 'Program', required: true })
  programId: string;

  @Prop({ type: String, ref: 'AcademicPeriod', required: true })
  periodId: string;

  @Prop({ type: String, ref: 'Course', required: true })
  sourceCourseId: string;

  @Prop({ type: String, ref: 'CourseGroup', required: true })
  sourceGroupId: string;

  @Prop({ type: String, ref: 'Course' })
  targetCourseId?: string;

  @Prop({ type: String, ref: 'CourseGroup' })
  targetGroupId?: string;

  @Prop({ required: true, enum: RequestState, default: RequestState.PENDING })
  state: RequestState;

  @Prop({ type: String, ref: 'RequestStateDefinition' })
  currentStateId?: string; // Referencia a la definición del estado

  @Prop({ required: true })
  priority: number;

  @Prop()
  observations?: string;

  @Prop({ default: false })
  exceptional: boolean;

  @Prop({ type: String, ref: 'User' })
  assignedToUserId?: string;

  @Prop()
  dueAt?: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolutionReason?: string;

  // NUEVO: Version para control de concurrencia (bloqueo optimista)
  @Prop({ default: 1 })
  version: number;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  // NUEVO: Último actor que modificó el estado
  @Prop({ type: String, ref: 'User' })
  lastStateChangedBy?: string;

  @Prop()
  lastStateChangedAt?: Date;
}

export const ChangeRequestSchema = SchemaFactory.createForClass(ChangeRequest);

// Índices para mejorar performance
ChangeRequestSchema.index({ state: 1, createdAt: -1 });
ChangeRequestSchema.index({ studentId: 1, state: 1 });
ChangeRequestSchema.index({ programId: 1, state: 1 });