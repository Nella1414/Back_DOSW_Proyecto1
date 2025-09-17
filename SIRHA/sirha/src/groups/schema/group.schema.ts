import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Subject } from '../../subjects/schema/subjects.schema';
import { Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema()
export class Group {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Subject.name, required: true })
  subjectId: string; 

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  schedule: string;

  @Prop({ required: true })
  capacity: number;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
