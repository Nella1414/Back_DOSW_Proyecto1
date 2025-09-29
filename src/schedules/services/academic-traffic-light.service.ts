import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../../students/entities/student.entity';
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from '../../enrollments/entities/enrollment.entity';
import { CourseGroup, CourseGroupDocument } from '../../course-groups/entities/course-group.entity';
import { Course, CourseDocument } from '../../courses/entities/course.entity';
import { AcademicPeriod, AcademicPeriodDocument } from '../../academic-periods/entities/academic-period.entity';

export type TrafficLightColor = 'green' | 'yellow' | 'red';

export interface StudentAcademicStatus {
  studentId: string;
  studentName: string;
  currentSemester: number;
  overallColor: TrafficLightColor;
  passedCredits: number;
  totalCredits: number;
  gpa: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface CourseStatus {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: number;
  status: EnrollmentStatus;
  color: TrafficLightColor;
  periodCode: string;
}

@Injectable()
export class AcademicTrafficLightService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(CourseGroup.name) private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(AcademicPeriod.name) private academicPeriodModel: Model<AcademicPeriodDocument>,
  ) {}

  /**
   * Determine traffic light color based on enrollment status and grade
   */
  getTrafficLightColor(status: EnrollmentStatus, grade?: number): TrafficLightColor {
    switch (status) {
      case EnrollmentStatus.PASSED:
        return 'green';
      case EnrollmentStatus.ENROLLED:
        return 'yellow';
      case EnrollmentStatus.FAILED:
        return 'red';
      default:
        return 'yellow';
    }
  }

  /**
   * Enhanced traffic light color considering grade thresholds
   */
  getEnhancedTrafficLightColor(status: EnrollmentStatus, grade?: number): TrafficLightColor {
    if (status === EnrollmentStatus.PASSED) {
      if (grade && grade >= 4.0) return 'green';
      if (grade && grade >= 3.0) return 'green';
      return 'green';
    }

    if (status === EnrollmentStatus.ENROLLED) {
      return 'yellow';
    }

    if (status === EnrollmentStatus.FAILED) {
      return 'red';
    }

    return 'yellow';
  }

  /**
   * Calculate overall academic status for a student
   */
  async getStudentAcademicStatus(studentId: string): Promise<StudentAcademicStatus> {
    const student = await this.studentModel.findOne({ code: studentId }).exec();
    if (!student) {
      throw new Error('Student not found');
    }

    const allEnrollments = await this.enrollmentModel
      .find({ studentId: student._id })
      .populate({
        path: 'groupId',
        populate: [
          { path: 'courseId' },
          { path: 'periodId' }
        ]
      })
      .exec();

    let passedCredits = 0;
    let totalCredits = 0;
    let totalGradePoints = 0;
    let totalPassedCourses = 0;
    let failedCourses = 0;
    let currentEnrollments = 0;

    for (const enrollment of allEnrollments) {
      const group = enrollment.groupId as any;
      const course = group.courseId;

      totalCredits += course.credits;

      switch (enrollment.status) {
        case EnrollmentStatus.PASSED:
          passedCredits += course.credits;
          if (enrollment.grade) {
            totalGradePoints += enrollment.grade * course.credits;
            totalPassedCourses += course.credits;
          }
          break;
        case EnrollmentStatus.FAILED:
          failedCourses++;
          break;
        case EnrollmentStatus.ENROLLED:
          currentEnrollments++;
          break;
      }
    }

    const gpa = totalPassedCourses > 0 ? totalGradePoints / totalPassedCourses : 0;
    const completionRate = totalCredits > 0 ? passedCredits / totalCredits : 0;

    // Determine overall risk level and color
    let overallColor: TrafficLightColor = 'green';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const recommendations: string[] = [];

    if (gpa < 3.0 || completionRate < 0.6 || failedCourses > 2) {
      overallColor = 'red';
      riskLevel = 'high';
      recommendations.push('Schedule academic tutoring sessions');
      recommendations.push('Meet with academic advisor immediately');
      if (gpa < 3.0) recommendations.push('Focus on improving study habits');
      if (failedCourses > 2) recommendations.push('Consider reducing course load');
    } else if (gpa < 3.5 || completionRate < 0.8 || failedCourses > 0) {
      overallColor = 'yellow';
      riskLevel = 'medium';
      recommendations.push('Monitor academic progress closely');
      recommendations.push('Consider additional study resources');
      if (currentEnrollments > 6) recommendations.push('Evaluate current course load');
    } else {
      recommendations.push('Continue excellent academic performance');
      recommendations.push('Consider advanced or honors courses');
    }

    return {
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      currentSemester: student.currentSemester || 1,
      overallColor,
      passedCredits,
      totalCredits,
      gpa: Math.round(gpa * 100) / 100,
      riskLevel,
      recommendations
    };
  }

  /**
   * Get course statuses with traffic light colors for a student
   */
  async getStudentCourseStatuses(studentId: string): Promise<{
    passedCourses: CourseStatus[];
    currentCourses: CourseStatus[];
    failedCourses: CourseStatus[];
  }> {
    const student = await this.studentModel.findOne({ code: studentId }).exec();
    if (!student) {
      throw new Error('Student not found');
    }

    const allEnrollments = await this.enrollmentModel
      .find({ studentId: student._id })
      .populate({
        path: 'groupId',
        populate: [
          { path: 'courseId' },
          { path: 'periodId' }
        ]
      })
      .exec();

    const passedCourses: CourseStatus[] = [];
    const currentCourses: CourseStatus[] = [];
    const failedCourses: CourseStatus[] = [];

    for (const enrollment of allEnrollments) {
      const group = enrollment.groupId as any;
      const course = group.courseId;
      const period = group.periodId;

      const courseStatus: CourseStatus = {
        periodCode: period.code,
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        grade: enrollment.grade,
        status: enrollment.status,
        color: this.getEnhancedTrafficLightColor(enrollment.status, enrollment.grade)
      };

      switch (enrollment.status) {
        case EnrollmentStatus.PASSED:
          passedCourses.push(courseStatus);
          break;
        case EnrollmentStatus.ENROLLED:
          currentCourses.push(courseStatus);
          break;
        case EnrollmentStatus.FAILED:
          failedCourses.push(courseStatus);
          break;
      }
    }

    return {
      passedCourses: passedCourses.sort((a, b) => a.periodCode.localeCompare(b.periodCode)),
      currentCourses: currentCourses.sort((a, b) => a.courseCode.localeCompare(b.courseCode)),
      failedCourses: failedCourses.sort((a, b) => a.periodCode.localeCompare(b.periodCode))
    };
  }

  /**
   * Get statistics for academic traffic light system
   */
  async getAcademicStatistics(): Promise<{
    totalStudents: number;
    greenStudents: number;
    yellowStudents: number;
    redStudents: number;
    averageGPA: number;
  }> {
    const students = await this.studentModel.find().exec();

    let greenCount = 0;
    let yellowCount = 0;
    let redCount = 0;
    let totalGPA = 0;
    let studentsWithGPA = 0;

    for (const student of students) {
      try {
        const status = await this.getStudentAcademicStatus(student.code);

        switch (status.overallColor) {
          case 'green':
            greenCount++;
            break;
          case 'yellow':
            yellowCount++;
            break;
          case 'red':
            redCount++;
            break;
        }

        if (status.gpa > 0) {
          totalGPA += status.gpa;
          studentsWithGPA++;
        }
      } catch (error) {
        // Continue processing other students if one fails
        continue;
      }
    }

    return {
      totalStudents: students.length,
      greenStudents: greenCount,
      yellowStudents: yellowCount,
      redStudents: redCount,
      averageGPA: studentsWithGPA > 0 ? Math.round((totalGPA / studentsWithGPA) * 100) / 100 : 0
    };
  }
}