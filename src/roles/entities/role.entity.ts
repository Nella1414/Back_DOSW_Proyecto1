import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;
// Define role names as an enum for better type safety
export enum RoleName {
  ADMIN = 'ADMIN',
  DEAN = 'DEAN',
  STUDENT = 'STUDENT',
}

export enum Permission {
  // User management
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',

  // Course management
  CREATE_COURSE = 'create_course',
  READ_COURSE = 'read_course',
  UPDATE_COURSE = 'update_course',
  DELETE_COURSE = 'delete_course',

  // Enrollment management
  CREATE_ENROLLMENT = 'create_enrollment',
  READ_ENROLLMENT = 'read_enrollment',
  UPDATE_ENROLLMENT = 'update_enrollment',
  DELETE_ENROLLMENT = 'delete_enrollment',

  // Academic records
  CREATE_GRADE = 'create_grade',
  READ_GRADE = 'read_grade',
  UPDATE_GRADE = 'update_grade',
  DELETE_GRADE = 'delete_grade',

  // Reports
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',

  // System administration
  MANAGE_SYSTEM = 'manage_system',
  VIEW_LOGS = 'view_logs',
}

@Schema({ timestamps: true })
export class Role {
  @Prop({
    required: true,
    unique: true,
    enum: RoleName,
    type: String,
  })
  name: RoleName;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: false })
  description?: string;

  @Prop({
    type: [String],
    enum: Permission,
    default: [],
  })
  permissions: Permission[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 1 })
  priority: number;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
