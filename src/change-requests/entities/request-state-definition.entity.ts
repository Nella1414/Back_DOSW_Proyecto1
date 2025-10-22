import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RequestStateDefinitionDocument = RequestStateDefinition & Document;

@Schema({ collection: 'request_state_definitions' })
export class RequestStateDefinition {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  color: string; // Hex color for UI representation

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number; // Para ordenar en la UI

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const RequestStateDefinitionSchema = SchemaFactory.createForClass(
  RequestStateDefinition,
);