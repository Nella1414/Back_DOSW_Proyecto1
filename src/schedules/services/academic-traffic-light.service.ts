import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../../students/entities/student.entity';
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from '../../enrollments/entities/enrollment.entity';
import { CourseGroup, CourseGroupDocument } from '../../course-groups/entities/course-group.entity';
import { Course, CourseDocument } from '../../courses/entities/course.entity';
import { AcademicPeriod, AcademicPeriodDocument } from '../../academic-periods/entities/academic-period.entity';

/**
 * Traffic Light Color Types
 *
 * ! NOTA: Los colores del semáforo académico representan el estado del estudiante
 * * green: Rendimiento excelente o bueno
 * ? yellow: Rendimiento regular que requiere atención
 * ! red: Rendimiento deficiente que requiere intervención inmediata
 */
export type TrafficLightColor = 'green' | 'yellow' | 'red';

/**
 * Student Academic Status Interface
 *
 * Represents the comprehensive academic status of a student
 * including performance metrics and risk assessment
 */
export interface StudentAcademicStatus {
  studentId: string; // * Código único del estudiante
  studentName: string; // * Nombre completo del estudiante
  currentSemester: number; // * Semestre académico actual
  overallColor: TrafficLightColor; // ! Color general del semáforo académico
  passedCredits: number; // * Créditos aprobados
  totalCredits: number; // * Total de créditos cursados
  gpa: number; // * Promedio ponderado acumulado
  riskLevel: 'low' | 'medium' | 'high'; // ! Nivel de riesgo académico
  recommendations: string[]; // ? Recomendaciones para el estudiante
}

/**
 * Course Status Interface
 *
 * Represents the status of a specific course for a student
 * including enrollment status and performance metrics
 */
export interface CourseStatus {
  courseCode: string; // * Código del curso
  courseName: string; // * Nombre del curso
  credits: number; // * Número de créditos del curso
  grade?: number; // ? Calificación obtenida (si está disponible)
  status: EnrollmentStatus; // * Estado de la matrícula
  color: TrafficLightColor; // ! Color del semáforo para este curso
  periodCode: string; // * Código del periodo académico
}

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
 * ! IMPORTANTE: Este servicio contiene la lógica principal del sistema
 * ! de semáforo académico y debe ser la única fuente de verdad para
 * ! los cálculos de rendimiento académico
 */
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