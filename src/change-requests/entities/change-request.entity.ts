import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChangeRequestDocument = ChangeRequest & Document;

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

  @Prop({ required: true, unique: true })
  requestHash: string;

  @Prop()
  reason: string;

  @Prop()
  observations: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChangeRequestSchema = SchemaFactory.createForClass(ChangeRequest);

// Índices para performance
ChangeRequestSchema.index({ requestHash: 1 });
ChangeRequestSchema.index({ userId: 1, status: 1 });
ChangeRequestSchema.index({ createdAt: -1 });