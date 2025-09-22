import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroupScheduleDocument = GroupSchedule & Document;

@Schema()
export class GroupSchedule {
  @Prop({ type: String, ref: 'CourseGroup', required: true })
  groupId: string;

  @Prop({ required: true })
  dayOfWeek: number; // 1=Mon .. 7=Sun

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop()
  room?: string;
}

export const GroupScheduleSchema = SchemaFactory.createForClass(GroupSchedule);
