import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Student,
  StudentDocument,
} from '../../students/entities/student.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../../enrollments/entities/enrollment.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../../course-groups/entities/course-group.entity';
import { Course, CourseDocument } from '../../courses/entities/course.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../../academic-periods/entities/academic-period.entity';
import {
  StudentAcademicStatusDto,
  AcademicStatisticsDto,
  StudentTrafficLightReportDto,
  CourseStatusDto,
} from '../dto/academic-traffic-light.dto';
import {
  TrafficLightColor,
  StudentAcademicStatus,
  CourseStatus,
  PopulatedEnrollment,
  PopulatedGroup,
} from '../interfaces/academic-status.interface';

/**
 * Academic Traffic Light Service
 *
 * Core service that implements the academic traffic light system logic.
 * This service calculates and provides academic performance indicators
 * for students based on their enrollment history and grades.
 *
 * Features:
 * - Student academic status calculation with traffic light colors
 * - Course-level performance tracking
 * - Risk assessment and recommendations
 * - Academic statistics aggregation
 *
 * Traffic Light Colors Logic:
 * - 🟢 GREEN: Course passed with grade >= 3.0
 * - 🔵 BLUE: Course currently enrolled (in progress)
 * - 🔴 RED: Course failed with grade < 3.0
 *
 * ! IMPORTANTE: Este servicio contiene la lógica principal del sistema
 * ! de semáforo académico y debe ser la única fuente de verdad para
 * ! los cálculos de rendimiento académico
 */
@Injectable()
export class AcademicTrafficLightService {
  private readonly logger = new Logger(AcademicTrafficLightService.name);

  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(CourseGroup.name)
    private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(AcademicPeriod.name)
    private academicPeriodModel: Model<AcademicPeriodDocument>,
  ) {}

  /**
   * Helper method to find student by external ID or student code
   * This centralizes the search logic used across multiple methods
   *
   * @param studentId - Can be either externalId (from auth) or student code
   * @returns Student document
   * @throws NotFoundException if student not found
   */
  private async findStudentByIdOrCode(
    studentId: string,
  ): Promise<StudentDocument> {
    // Try to find by externalId first (for authenticated users)
    let student = await this.studentModel
      .findOne({ externalId: studentId })
      .exec();

    // If not found, try by code (for direct lookups)
    if (!student) {
      student = await this.studentModel.findOne({ code: studentId }).exec();
    }

    // If still not found, throw exception
    if (!student) {
      this.logger.warn(`Student with ID ${studentId} not found`);
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return student;
  }

  /**
   * Determine traffic light color based on enrollment status and grade
   *
   * Color Logic:
   * - 🟢 GREEN: Course PASSED with grade >= 3.0
   * - 🔵 BLUE: Course currently ENROLLED (in progress)
   * - 🔴 RED: Course FAILED (grade < 3.0 or explicitly marked as failed)
   *
   * @param status - Enrollment status (PASSED, ENROLLED, FAILED)
   * @param grade - Optional grade value (0-5 scale)
   * @returns Traffic light color
   */
  getTrafficLightColor(
    status: EnrollmentStatus,
    grade?: number,
  ): TrafficLightColor {
    switch (status) {
      case EnrollmentStatus.PASSED:
        // For passed courses, verify grade is actually passing
        if (grade !== undefined && grade < 3.0) {
          this.logger.warn(
            `Course marked as PASSED but grade is ${grade} (below 3.0)`,
          );
          return 'red'; // Inconsistency: marked as passed but grade is failing
        }
        return 'green';

      case EnrollmentStatus.ENROLLED:
        // Currently taking the course
        return 'blue';

      case EnrollmentStatus.FAILED:
        // Failed course
        return 'red';

      default:
        // Default to blue for unknown statuses
        this.logger.warn(`Unknown enrollment status: ${status}`);
        return 'blue';
    }
  }

  /**
   * Calculate overall academic status for a student
   * @param studentId - Can be either externalId (from auth) or student code
   */
  async getStudentAcademicStatus(
    studentId: string,
  ): Promise<StudentAcademicStatus> {
    const student = await this.findStudentByIdOrCode(studentId);

    const allEnrollments = await this.enrollmentModel
      .find({ studentId: student._id })
      .populate({
        path: 'groupId',
        populate: [{ path: 'courseId' }, { path: 'periodId' }],
      })
      .exec();

    let passedCredits = 0;
    let totalCredits = 0;
    let totalGradePoints = 0;
    let totalPassedCourses = 0;
    let failedCourses = 0;
    let currentEnrollments = 0;

    for (const enrollment of allEnrollments) {
      const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
      const group = populatedEnrollment.groupId;

      if (!group || !group.courseId) {
        continue; // Skip enrollments with missing data
      }
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

    const gpa =
      totalPassedCourses > 0 ? totalGradePoints / totalPassedCourses : 0;
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
      if (failedCourses > 2)
        recommendations.push('Consider reducing course load');
    } else if (gpa < 3.5 || completionRate < 0.8 || failedCourses > 0) {
      overallColor = 'blue';
      riskLevel = 'medium';
      recommendations.push('Monitor academic progress closely');
      recommendations.push('Consider additional study resources');
      if (currentEnrollments > 6)
        recommendations.push('Evaluate current course load');
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
      recommendations,
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
    const student = await this.findStudentByIdOrCode(studentId);

    const allEnrollments = await this.enrollmentModel
      .find({ studentId: student._id })
      .populate({
        path: 'groupId',
        populate: [{ path: 'courseId' }, { path: 'periodId' }],
      })
      .exec();

    const passedCourses: CourseStatus[] = [];
    const currentCourses: CourseStatus[] = [];
    const failedCourses: CourseStatus[] = [];

    for (const enrollment of allEnrollments) {
      const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
      const group = populatedEnrollment.groupId;

      if (!group || !group.courseId || !group.periodId) {
        continue; // Skip enrollments with missing data
      }
      const course = group.courseId;
      const period = group.periodId;

      const courseStatus: CourseStatus = {
        periodCode: period.code,
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        grade: enrollment.grade,
        status: enrollment.status,
        color: this.getTrafficLightColor(enrollment.status, enrollment.grade),
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
      passedCourses: passedCourses.sort((a, b) =>
        a.periodCode.localeCompare(b.periodCode),
      ),
      currentCourses: currentCourses.sort((a, b) =>
        a.courseCode.localeCompare(b.courseCode),
      ),
      failedCourses: failedCourses.sort((a, b) =>
        a.periodCode.localeCompare(b.periodCode),
      ),
    };
  }

  /**
   * Get comprehensive academic traffic light for a student
   */
  async getAcademicTrafficLight(
    studentId: string,
    includeDetails: boolean = false,
  ): Promise<{
    studentId: string;
    studentName: string;
    currentSemester: number;
    status: TrafficLightColor;
    progressPercentage: number;
    passedCredits: number;
    totalCredits: number;
    gpa: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    currentPeriod: string | null;
    inconsistent: boolean;
    inconsistencies: string[];
    breakdown?: {
      passedCourses: CourseStatus[];
      currentCourses: CourseStatus[];
      failedCourses: CourseStatus[];
      metrics: {
        totalPassed: number;
        totalCurrent: number;
        totalFailed: number;
        averageGradePerSemester: Array<{
          period: string;
          averageGrade: number;
          totalCredits: number;
          courseCount: number;
        }>;
      };
    };
  }> {
    const student = await this.findStudentByIdOrCode(studentId);

    const academicStatus = await this.getStudentAcademicStatus(studentId);

    const currentPeriod = await this.academicPeriodModel
      .findOne({ isActive: true })
      .exec();
    const progressPercentage =
      academicStatus.totalCredits > 0
        ? Math.round(
            (academicStatus.passedCredits / academicStatus.totalCredits) * 100,
          )
        : 0;

    const inconsistencies = await this.detectInconsistencies(studentId);

    if (includeDetails) {
      const courseStatuses = await this.getStudentCourseStatuses(studentId);
      const avgGradePerSemester =
        await this.calculateAverageGradePerSemester(studentId);

      return {
        studentId: academicStatus.studentId,
        studentName: academicStatus.studentName,
        currentSemester: academicStatus.currentSemester,
        status: academicStatus.overallColor,
        progressPercentage,
        passedCredits: academicStatus.passedCredits,
        totalCredits: academicStatus.totalCredits,
        gpa: academicStatus.gpa,
        riskLevel: academicStatus.riskLevel,
        recommendations: academicStatus.recommendations,
        currentPeriod: currentPeriod ? currentPeriod.code : null,
        inconsistent: inconsistencies.length > 0,
        inconsistencies: inconsistencies,
        breakdown: {
          passedCourses: courseStatuses.passedCourses,
          currentCourses: courseStatuses.currentCourses,
          failedCourses: courseStatuses.failedCourses,
          metrics: {
            totalPassed: courseStatuses.passedCourses.length,
            totalCurrent: courseStatuses.currentCourses.length,
            totalFailed: courseStatuses.failedCourses.length,
            averageGradePerSemester: avgGradePerSemester,
          },
        },
      };
    }

    return {
      studentId: academicStatus.studentId,
      studentName: academicStatus.studentName,
      currentSemester: academicStatus.currentSemester,
      status: academicStatus.overallColor,
      progressPercentage,
      passedCredits: academicStatus.passedCredits,
      totalCredits: academicStatus.totalCredits,
      gpa: academicStatus.gpa,
      riskLevel: academicStatus.riskLevel,
      recommendations: academicStatus.recommendations,
      currentPeriod: currentPeriod ? currentPeriod.code : null,
      inconsistent: inconsistencies.length > 0,
      inconsistencies: inconsistencies,
    };
  }

  /**
   * Detect inconsistencies in academic data
   */
  async detectInconsistencies(studentId: string): Promise<string[]> {
    const inconsistencies: string[] = [];

    try {
      const student = await this.findStudentByIdOrCode(studentId);

      const allEnrollments = await this.enrollmentModel
        .find({ studentId: student._id })
        .populate({
          path: 'groupId',
          populate: [{ path: 'courseId' }, { path: 'periodId' }],
        })
        .exec();

      for (const enrollment of allEnrollments) {
        const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
        const group = populatedEnrollment.groupId;

        if (!group) {
          inconsistencies.push('Enrollment with missing group information');
          continue;
        }

        const course = group.courseId;
        const period = group.periodId;

        if (!course) {
          inconsistencies.push('Group with missing course information');
          continue;
        }

        if (!period) {
          inconsistencies.push('Group with missing period information');
          continue;
        }

        if (!course.credits || course.credits <= 0) {
          inconsistencies.push(`Course ${course.code} has invalid credit value`);
        }

        // Check for passed courses without grades
        if (enrollment.status === EnrollmentStatus.PASSED && !enrollment.grade) {
          inconsistencies.push(`Passed course ${course.code} missing grade`);
        }

        // Check for failed courses without grades
        if (enrollment.status === EnrollmentStatus.FAILED && !enrollment.grade) {
          inconsistencies.push(
            `Failed course ${course.code} missing grade (should have grade < 3.0)`,
          );
        }

        // Check for enrolled courses WITH grades (shouldn't have grades yet)
        if (
          enrollment.status === EnrollmentStatus.ENROLLED &&
          enrollment.grade !== undefined &&
          enrollment.grade !== null
        ) {
          inconsistencies.push(
            `Enrolled course ${course.code} has grade ${enrollment.grade} (should not have grade yet)`,
          );
        }

        // Check for invalid grade ranges
        if (
          enrollment.grade !== undefined &&
          enrollment.grade !== null &&
          (enrollment.grade < 0 || enrollment.grade > 5)
        ) {
          inconsistencies.push(
            `Course ${course.code} has invalid grade: ${enrollment.grade} (must be 0-5)`,
          );
        }

        // Check for passed courses with failing grades
        if (
          enrollment.status === EnrollmentStatus.PASSED &&
          enrollment.grade &&
          enrollment.grade < 3.0
        ) {
          inconsistencies.push(
            `Course ${course.code} marked as PASSED but grade ${enrollment.grade} is below passing threshold (3.0)`,
          );
        }

        // Check for failed courses with passing grades
        if (
          enrollment.status === EnrollmentStatus.FAILED &&
          enrollment.grade &&
          enrollment.grade >= 3.0
        ) {
          inconsistencies.push(
            `Course ${course.code} marked as FAILED but grade ${enrollment.grade} is above failing threshold (3.0)`,
          );
        }
      }

      const duplicateCourses = this.findDuplicatePassedCourses(allEnrollments);
      if (duplicateCourses.length > 0) {
        inconsistencies.push(
          `Duplicate passed courses detected: ${duplicateCourses.join(', ')}`,
        );
      }

      return inconsistencies;
    } catch (error) {
      this.logger.error(
        `Error detecting inconsistencies for student ${studentId}:`,
        error,
      );
      return ['Error detecting inconsistencies: ' + error.message];
    }
  }

  /**
   * Find duplicate passed courses
   */
  private findDuplicatePassedCourses(
    enrollments: EnrollmentDocument[],
  ): string[] {
    const passedCourses = new Map<string, number>();
    const duplicates: string[] = [];

    for (const enrollment of enrollments) {
      if (enrollment.status === EnrollmentStatus.PASSED) {
        const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
        const group = populatedEnrollment.groupId;

        if (group && group.courseId) {
          const courseCode = group.courseId.code;
          const count = passedCourses.get(courseCode) || 0;
          passedCourses.set(courseCode, count + 1);

          if (count + 1 > 1 && !duplicates.includes(courseCode)) {
            duplicates.push(courseCode);
          }
        }
      }
    }

    return duplicates;
  }

  /**
   * Calculate average grade per semester
   */
  async calculateAverageGradePerSemester(
    studentId: string,
  ): Promise<
    Array<{
      period: string;
      averageGrade: number;
      totalCredits: number;
      courseCount: number;
    }>
  > {
    const student = await this.findStudentByIdOrCode(studentId);

    const allEnrollments = await this.enrollmentModel
      .find({
        studentId: student._id,
        status: EnrollmentStatus.PASSED,
        grade: { $exists: true },
      })
      .populate({
        path: 'groupId',
        populate: [{ path: 'courseId' }, { path: 'periodId' }],
      })
      .exec();

    const semesterMap = new Map<
      string,
      { total: number; credits: number; courses: number }
    >();

    for (const enrollment of allEnrollments) {
      const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
      const group = populatedEnrollment.groupId;

      if (!group || !group.courseId || !group.periodId || !enrollment.grade) {
        continue; // Skip enrollments with missing data
      }

      const periodCode = group.periodId.code;
      const grade = enrollment.grade;
      const credits = group.courseId.credits;

      if (!semesterMap.has(periodCode)) {
        semesterMap.set(periodCode, { total: 0, credits: 0, courses: 0 });
      }

      const semester = semesterMap.get(periodCode)!;
      semester.total += grade * credits;
      semester.credits += credits;
      semester.courses += 1;
    }

    return Array.from(semesterMap.entries())
      .map(([periodCode, data]) => ({
        period: periodCode,
        averageGrade:
          data.credits > 0
            ? Math.round((data.total / data.credits) * 100) / 100
            : 0,
        totalCredits: data.credits,
        courseCount: data.courses,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get comprehensive academic statistics for all students
   */
  async getAcademicStatistics(): Promise<AcademicStatisticsDto> {
    const students = await this.studentModel.find().exec();

    let greenCount = 0;
    let blueCount = 0;
    let redCount = 0;
    let totalGPA = 0;
    let studentsWithGPA = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        const status = await this.getStudentAcademicStatus(student.code);

        switch (status.overallColor) {
          case 'green':
            greenCount++;
            break;
          case 'blue':
            blueCount++;
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
        // Log error and continue processing other students
        errorCount++;
        this.logger.warn(
          `Failed to calculate status for student ${student.code}: ${error.message}`,
        );
        continue;
      }
    }

    if (errorCount > 0) {
      this.logger.warn(
        `Statistics calculation completed with ${errorCount} errors out of ${students.length} students`,
      );
    }

    return {
      totalStudents: students.length,
      greenStudents: greenCount,
      blueStudents: blueCount,
      redStudents: redCount,
      averageGPA:
        studentsWithGPA > 0
          ? Math.round((totalGPA / studentsWithGPA) * 100) / 100
          : 0,
      greenPercentage:
        students.length > 0
          ? Math.round((greenCount / students.length) * 100)
          : 0,
      bluePercentage:
        students.length > 0
          ? Math.round((blueCount / students.length) * 100)
          : 0,
      redPercentage:
        students.length > 0 ? Math.round((redCount / students.length) * 100) : 0,
    };
  }

  /**
   * Get complete traffic light report for a student
   */
  async getStudentTrafficLightReport(
    studentId: string,
  ): Promise<StudentTrafficLightReportDto> {
    const [studentInfo, courseStatuses] = await Promise.all([
      this.getStudentAcademicStatus(studentId),
      this.getStudentCourseStatuses(studentId),
    ]);

    return {
      studentInfo,
      courseStatuses,
    };
  }

}
