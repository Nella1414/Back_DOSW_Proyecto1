import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditRequestDocument = AuditRequest & Document;

@Schema({ timestamps: true })
export class AuditRequest {
  @Prop({ required: true })
  requestId: string;

  @Prop({ required: true, enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'RADICATE', 'ROUTE', 'FALLBACK', 'ROUTE_ASSIGNED'] })
  eventType: string;

  @Prop({ required: true })
  actorId: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object })
  requestDetails: Record<string, any>;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop()
  sourceData: Record<string, any>;

  @Prop()
  targetData: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AuditRequestSchema = SchemaFactory.createForClass(AuditRequest);