import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FacultyDocument = Faculty & Document;

@Schema()
export class Faculty {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;
}

export const FacultySchema = SchemaFactory.createForClass(Faculty);