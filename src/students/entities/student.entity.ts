import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: String, ref: 'Program', required: true })
  programId: string;

  @Prop({ default: 1 })
  currentSemester: number;

  @Prop({ required: true, unique: true })
  externalId: string;

  @Prop({ 
    type: String, 
    default: null,
    maxlength: 2000,
    set: (value: string | null | undefined) => {
      // Convertir string vacío a null
      if (!value || value.trim() === '') return null;
      return value;
    }
  })
  observations: string | null;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  createdAt?: Date;
  updatedAt?: Date;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

// Add virtual property to schema
StudentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
