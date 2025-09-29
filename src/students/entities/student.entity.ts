import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema()
export class Student {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: String, ref: 'Program', required: true })
  programId: string;

  @Prop()
  currentSemester?: number;

  @Prop({ required: true, unique: true })
  externalId: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
