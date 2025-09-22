import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum RequestState {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
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

  @Prop({ required: true, enum: RequestState })
  state: RequestState;

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

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const ChangeRequestSchema = SchemaFactory.createForClass(ChangeRequest);
