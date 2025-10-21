import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum WindowType {
  CREATION = 'creation',
  APPROVAL = 'approval',
}

export type ChangeWindowDocument = ChangeWindow & Document;

@Schema()
export class ChangeWindow {
  @Prop({ type: String, ref: 'AcademicPeriod', required: true })
  periodId: string;

  @Prop({ required: true, enum: WindowType })
  windowType: WindowType;

  @Prop({ required: true })
  startsAt: Date;

  @Prop({ required: true })
  endsAt: Date;

  @Prop({ default: true })
  active: boolean;
}

export const ChangeWindowSchema = SchemaFactory.createForClass(ChangeWindow);
