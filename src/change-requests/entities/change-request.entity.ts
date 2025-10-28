import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChangeRequestDocument = ChangeRequest & Document;

export enum RequestState {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class ChangeRequest {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  sourceSubjectId: string;

  @Prop({ required: true })
  sourceGroupId: string;

  @Prop({ required: true })
  targetSubjectId: string;

  @Prop({ required: true })
  targetGroupId: string;

  @Prop({ required: true, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status: string;

  @Prop({ required: true, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  priority: string;

  @Prop({ required: true, unique: true, index: true })
  requestHash: string;

  @Prop({ unique: true, sparse: true })
  radicado: string;

  @Prop({ required: true })
  assignedProgramId: string;

  @Prop()
  reason: string;

  @Prop()
  observations: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChangeRequestSchema = SchemaFactory.createForClass(ChangeRequest);

// Índices para performance (requestHash ya tiene índice único en @Prop)
ChangeRequestSchema.index({ userId: 1, status: 1 });
ChangeRequestSchema.index({ createdAt: -1 });
