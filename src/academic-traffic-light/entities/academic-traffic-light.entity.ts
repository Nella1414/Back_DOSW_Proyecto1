import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AcademicTrafficLightDocument = AcademicTrafficLight & Document;

export enum AcademicStanding {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  WARNING = 'warning',
  PROBATION = 'probation',
  CRITICAL = 'critical',
}

export enum TrafficLightColor {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}

@Schema({ timestamps: true })
export class AcademicTrafficLight {
  @Prop({ type: String, ref: 'Student', required: true })
  studentId: string;

  @Prop({ type: String, ref: 'AcademicPeriod', required: true })
  periodId: string;

  @Prop({ required: true, min: 0 })
  totalCreditsAttempted: number;

  @Prop({ required: true, min: 0 })
  totalCreditsEarned: number;

  @Prop({ required: true, min: 0, max: 5 })
  currentGPA: number;

  @Prop({ required: true, min: 0, max: 5 })
  cumulativeGPA: number;

  @Prop({ required: true, enum: AcademicStanding })
  academicStanding: AcademicStanding;

  @Prop({ required: true, enum: TrafficLightColor })
  trafficLightColor: TrafficLightColor;

  @Prop({ default: Date.now })
  calculatedAt: Date;

  @Prop()
  observations?: string;

  @Prop({ default: 0 })
  passedCourses: number;

  @Prop({ default: 0 })
  failedCourses: number;

  @Prop({ default: 0 })
  enrolledCourses: number;
}

export const AcademicTrafficLightSchema =
  SchemaFactory.createForClass(AcademicTrafficLight);
