import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RadicadoCounterDocument = RadicadoCounter & Document;

@Schema({ timestamps: true })
export class RadicadoCounter {
  @Prop({ required: true, unique: true })
  year: number;

  @Prop({ required: true, default: 0 })
  sequence: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RadicadoCounterSchema = SchemaFactory.createForClass(RadicadoCounter);

// Índice único para garantizar un contador por año
RadicadoCounterSchema.index({ year: 1 }, { unique: true });