import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProgramDocument = Program & Document;

@Schema({ timestamps: true })
export class Program {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, ref: 'Faculty', required: true })
  facultyId: string;

  @Prop({ required: true })
  totalSemesters: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;

  @Prop()
  degree?: string;

  @Prop({ default: 0 })
  totalCredits?: number;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);

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
