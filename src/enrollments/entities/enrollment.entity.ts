import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  CANCELLED = 'cancelled',
  PASSED = 'passed',
  FAILED = 'failed',
}

export type EnrollmentDocument = Enrollment & Document;

@Schema()
export class Enrollment {
  @Prop({ type: String, ref: 'Student', required: true })
  studentId: string;

  @Prop({ type: String, ref: 'CourseGroup', required: true })
  groupId: string;

  @Prop({ required: true })
  enrolledAt: Date;

  @Prop({ required: true, enum: EnrollmentStatus })
  status: EnrollmentStatus;

  @Prop()
  grade?: number;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
