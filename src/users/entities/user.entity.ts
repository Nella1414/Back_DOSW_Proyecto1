import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, default: uuidv4, type: String })
  externalId: string;

  @Prop({ required: true, unique: true, type: String })
  email: string;

  @Prop({ required: true, default: 'DefaultNameDisplay', type: String })
  displayName: string;

  @Prop({ default: true, type: Boolean })
  active: boolean;

  @Prop({ type: [String], default: ['STUDENT'] })
  roles: string[];

  @Prop({ required: false, type: String })
  googleId?: string;

  @Prop({ required: false, type: String })
  firstName?: string;

  @Prop({ required: false, type: String })
  lastName?: string;

  @Prop({ required: false, type: String })
  picture?: string;

  @Prop({ default: false, type: Boolean })
  isGoogleUser: boolean;

  @Prop({ required: false, type: String })
  password?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
