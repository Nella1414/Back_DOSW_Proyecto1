import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseGroupDocument = CourseGroup & Document;

@Schema()
export class CourseGroup {
  @Prop({ type: String, ref: 'Course', required: true })
  courseId: string;

  @Prop({ type: String, ref: 'AcademicPeriod', required: true })
  periodId: string;

  @Prop({ required: true })
  groupCode: string;

  @Prop({ type: String, ref: 'Professor' })
  professorId?: string;

  @Prop()
  campus?: string;

  @Prop()
  modality?: string;

  @Prop({ required: true })
  capacityMax: number;
}

export const CourseGroupSchema = SchemaFactory.createForClass(CourseGroup);
