import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProgramCourseDocument = ProgramCourse & Document;

@Schema()
export class ProgramCourse {
  @Prop({ type: String, ref: 'Program', required: true })
  programId: string;

  @Prop({ type: String, ref: 'Course', required: true })
  courseId: string;

  @Prop({ default: false })
  isMandatory: boolean;

  @Prop()
  recommendedTerm?: number;
}

export const ProgramCourseSchema = SchemaFactory.createForClass(ProgramCourse);