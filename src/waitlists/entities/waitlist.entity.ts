import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum WaitlistStatus {
  WAITING = 'waiting',
  ADMITTED = 'admitted',
  WITHDRAWN = 'withdrawn',
}

export type WaitlistDocument = GroupWaitlist & Document;

@Schema()
export class GroupWaitlist {
  @Prop({ type: String, ref: 'CourseGroup', required: true })
  groupId: string;

  @Prop({ type: String, ref: 'Student', required: true })
  studentId: string;

  @Prop({ required: true })
  position: number;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true, enum: WaitlistStatus })
  status: WaitlistStatus;
}

export const WaitlistSchema = SchemaFactory.createForClass(GroupWaitlist);
