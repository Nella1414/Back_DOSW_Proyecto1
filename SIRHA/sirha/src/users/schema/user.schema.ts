import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export enum UserRole {
  STUDENT = 'student',
  DEANERY = 'deanery',
  ADMIN = 'admin',
}
export type UserDocument = User & Document & { _id: Types.ObjectId };

@Schema()
export class User {
  _id?: Types.ObjectId;
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role: UserRole;

  @Prop({ type: [String], default: [] }) 
  groupIds: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
