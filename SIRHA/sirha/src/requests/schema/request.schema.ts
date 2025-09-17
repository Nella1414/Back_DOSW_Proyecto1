import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RequestDocument = Request & Document;

@Schema()
export class Request {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: string;

  @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
  fromGroupId: string;

  @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
  toGroupId: string;

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
