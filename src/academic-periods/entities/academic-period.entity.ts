import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AcademicPeriodDocument = AcademicPeriod & Document;

@Schema({ timestamps: true })
export class AcademicPeriod {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  allowChangeRequests: boolean;

  @Prop({ default: true })
  isEnrollmentOpen: boolean;

  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'CLOSED', 'PLANNING'] })
  status: string;

  @Prop()
  description?: string;
}

export const AcademicPeriodSchema =
  SchemaFactory.createForClass(AcademicPeriod);
