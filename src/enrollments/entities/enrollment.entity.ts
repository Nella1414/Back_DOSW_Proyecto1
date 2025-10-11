import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Enrollment Status Enum
 * 
 * Possible states for an academic enrollment.
 */
export enum EnrollmentStatus {
  ENROLLED = 'enrolled',     // Actively enrolled
  CANCELLED = 'cancelled',   // Cancelled by student
  PASSED = 'passed',         // Course passed
  FAILED = 'failed',         // Course failed
  WITHDRAWN = 'withdrawn',   // Withdrawn for administrative reasons
}

export type EnrollmentDocument = Enrollment & Document;

/**
 * Enrollment Entity
 * 
 * Represents a student's enrollment in a course group.
 * Manages enrollment status, grades, and related metadata.
 * 
 * @schema Enrollment
 */
@Schema({ 
  timestamps: true,
  collection: 'enrollments'
})
export class Enrollment {
  /**
   * Student ID
   * Reference to the Student collection.
   */
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Student', 
    required: true,
    index: true
  })
  studentId: Types.ObjectId;

  /**
   * Course group ID
   * Reference to the CourseGroup collection.
   */
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'CourseGroup', 
    required: true,
    index: true
  })
  groupId: Types.ObjectId;

  /**
   * Academic period ID
   * Reference to the AcademicPeriod collection.
   */
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'AcademicPeriod', 
    required: true,
    index: true
  })
  academicPeriodId: Types.ObjectId;

  /**
   * Enrollment date and time.
   */
  @Prop({ 
    required: true,
    default: Date.now,
    type: Date
  })
  enrolledAt: Date;

  /**
   * Enrollment status.
   */
  @Prop({ 
    required: true, 
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ENROLLED,
    index: true
  })
  status: EnrollmentStatus;

  /**
   * Final grade for the course.
   * Range: 0.0 - 5.0
   */
  @Prop({ 
    min: 0, 
    max: 5,
    type: Number
  })
  grade?: number;

  /**
   * Cancellation date (if applicable).
   */
  @Prop({ 
    type: Date
  })
  cancelledAt?: Date;

  /**
   * Reason for cancellation.
   */
  @Prop({ 
    trim: true,
    maxlength: 500
  })
  cancellationReason?: string;

  /**
   * Date when the grade was registered.
   */
  @Prop({ 
    type: Date
  })
  gradedAt?: Date;

  /**
   * User who registered the grade.
   * Reference to the User collection.
   */
  @Prop({ 
    type: Types.ObjectId,
    ref: 'User'
  })
  gradedBy?: Types.ObjectId;

  /**
   * Number of attempts (for students repeating the course).
   */
  @Prop({ 
    type: Number,
    default: 1,
    min: 1
  })
  attemptNumber: number;

  /**
   * Indicates if this is a special or exceptional enrollment.
   */
  @Prop({ 
    type: Boolean,
    default: false
  })
  isSpecialEnrollment: boolean;

  /**
   * Additional notes about the enrollment.
   */
  @Prop({ 
    trim: true,
    maxlength: 1000
  })
  notes?: string;

  /**
   * Creation timestamp (automatic).
   */
  createdAt?: Date;

  /**
   * Last update timestamp (automatic).
   */
  updatedAt?: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

/**
 * Compound indexes to optimize queries.
 */
EnrollmentSchema.index({ studentId: 1, groupId: 1 }, { unique: true });
EnrollmentSchema.index({ studentId: 1, academicPeriodId: 1 });
EnrollmentSchema.index({ groupId: 1, status: 1 });
EnrollmentSchema.index({ academicPeriodId: 1, status: 1 });
EnrollmentSchema.index({ status: 1, enrolledAt: -1 });

/**
 * Middleware: Update cancelledAt when status changes to CANCELLED.
 * Also updates gradedAt and status based on grade.
 */
EnrollmentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === EnrollmentStatus.CANCELLED) {
    if (!this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  
  if (this.isModified('grade') && this.grade !== undefined) {
    if (!this.gradedAt) {
      this.gradedAt = new Date();
    }
    // Set status based on grade
    if (this.grade >= 3.0) {
      this.status = EnrollmentStatus.PASSED;
    } else {
      this.status = EnrollmentStatus.FAILED;
    }
  }
  
  next();
});