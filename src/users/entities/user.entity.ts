import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Student } from '../../students/entities/student.entity';
import { v4 as uuidv4 } from 'uuid';
export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true, default: uuidv4 })
  externalId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, default: 'DefaultNameDisplay' })
  displayName: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: [String], default: ["STUDENT"] })
  roles: string[];

  @Prop({ required: false })
  googleId?: string;

  @Prop({ required: false })
  firstName?: string;

  @Prop({ required: false })
  lastName?: string;

  @Prop({ required: false })
  picture?: string;

  @Prop({ default: false })
  isGoogleUser: boolean;

  @Prop({ required: false })
  password?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);