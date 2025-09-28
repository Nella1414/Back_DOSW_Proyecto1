import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseGroupDocument = CourseGroup & Document;

@Schema({ timestamps: true })
export class CourseGroup {
  @Prop({ type: String, ref: 'Course', required: true })
  courseId: string;

  @Prop({ required: true })
  groupNumber: string;

  @Prop({ type: String, ref: 'AcademicPeriod', required: true })
  periodId: string;

  @Prop({ required: true, min: 1 })
  maxStudents: number;

  @Prop({ default: 0, min: 0 })
  currentEnrollments: number;

  @Prop({ type: String, ref: 'User' })
  professorId?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  classroom?: string;

  @Prop()
  observations?: string;
}

export const CourseGroupSchema = SchemaFactory.createForClass(CourseGroup);