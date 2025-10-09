import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseDocument = Course & Document;

/**
 * Course Entity
 *
 * Represents an academic course in the system.
 * Includes information about credits, academic level, category, prerequisites, and status.
 *
 * @schema Course
 */
@Schema({
  timestamps: true,
  collection: 'courses'
})
export class Course {
  /**
   * Unique course code (e.g., CS101, MATH201).
   * Automatically stored in uppercase.
   */
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10,
    index: true
  })
  code: string;

  /**
   * Full name of the course.
   */
  @Prop({
    required: true,
    trim: true,
    maxlength: 200
  })
  name: string;

  /**
   * Number of academic credits.
   * Range: 1-10.
   */
  @Prop({
    required: true,
    min: 1,
    max: 10,
    type: Number
  })
  credits: number;

  /**
   * Academic level of the course.
   * 1-4: Undergraduate
   * 5-8: Graduate
   */
  @Prop({
    required: true,
    min: 1,
    max: 8,
    type: Number
  })
  academicLevel: number;

  /**
   * Category of the course.
   * Allowed values: Core, Elective, Laboratory, Seminar, Workshop, Thesis.
   */
  @Prop({
    required: true,
    enum: ['Core', 'Elective', 'Laboratory', 'Seminar', 'Workshop', 'Thesis'],
    type: String
  })
  category: string;

  /**
   * List of prerequisite course codes.
   * Example: ['CS100', 'MATH150']
   */
  @Prop({
    type: [String],
    default: [],
    uppercase: true
  })
  prerequisites: string[];

  /**
   * Indicates if the course is active in the catalog.
   * false = discontinued or inactive course.
   */
  @Prop({
    default: true,
    type: Boolean,
    index: true
  })
  active: boolean;

  /**
   * Detailed course description (optional).
   */
  @Prop({
    trim: true,
    maxlength: 1000
  })
  description?: string;

  /**
   * Code prefix (e.g., 'CS' from 'CS101').
   * Automatically extracted from the code.
   */
  @Prop({
    uppercase: true,
    maxlength: 10
  })
  codePrefix?: string;

  /**
   * Creation timestamp (automatic).
   */
  createdAt?: Date;

  /**
   * Last update timestamp (automatic).
   */
  updatedAt?: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

/**
 * Middleware: Extracts code prefix before saving.
 * Example: CS101 -> CS
 */
CourseSchema.pre('save', function(next) {
  if (this.code) {
    const match = this.code.match(/^[A-Z]+/);
    if (match) {
      this.codePrefix = match[0];
    }
  }
  next();
});

/**
 * Compound indexes to optimize queries.
 */
CourseSchema.index({ code: 1 });
CourseSchema.index({ active: 1, academicLevel: 1 });
CourseSchema.index({ codePrefix: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ name: 'text' }); // Text index for search