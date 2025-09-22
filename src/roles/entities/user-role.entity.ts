import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = UserRole & Document;

@Schema()
export class UserRole {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ type: String, ref: 'Role', required: true })
  roleId: string;
}
export const UserRoleSchema = SchemaFactory.createForClass(UserRole);