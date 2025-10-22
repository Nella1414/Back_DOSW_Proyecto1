import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ValidTransitionDocument = ValidTransition & Document;

@Schema({ collection: 'valid_transitions' })
export class ValidTransition {
  @Prop({ required: true, index: true })
  fromState: string;

  @Prop({ required: true, index: true })
  toState: string;

  @Prop()
  description?: string;

  @Prop()
  requiresReason?: boolean; // Si la transición requiere una razón obligatoria

  @Prop({ type: [String], default: [] })
  requiredPermissions?: string[]; // Permisos necesarios para esta transición

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const ValidTransitionSchema =
  SchemaFactory.createForClass(ValidTransition);

// Índice compuesto único para evitar duplicados
ValidTransitionSchema.index({ fromState: 1, toState: 1 }, { unique: true });