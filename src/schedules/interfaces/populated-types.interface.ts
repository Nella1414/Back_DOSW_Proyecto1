import { EnrollmentStatus } from '../../enrollments/entities/enrollment.entity';
import { Types } from 'mongoose';

/**
 * Populated Course Interface
 */
export interface PopulatedCourse {
  _id: Types.ObjectId;
  code: string;
  name: string;
  credits: number;
}

/**
 * Populated Period Interface
 */
export interface PopulatedPeriod {
  _id: Types.ObjectId;
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  isActive: boolean;
}

/**
 * Populated Group Interface
 */
export interface PopulatedGroup {
  _id: Types.ObjectId;
  groupNumber: number;
  courseId: PopulatedCourse;
  periodId: PopulatedPeriod;
  professorId?: Types.ObjectId;
  capacity: number;
}

/**
 * Populated Enrollment Interface
 */
export interface PopulatedEnrollment {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  groupId: PopulatedGroup;
  status: EnrollmentStatus;
  grade?: number;
  enrollmentDate: Date;
}

/**
 * Period Query Interface
 */
export interface PeriodQuery {
  status: string;
  startDate?: { $gte?: Date; $lte?: Date };
  endDate?: { $gte?: Date; $lte?: Date };
}
