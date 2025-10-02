import { Injectable } from '@nestjs/common';
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
  GroupSchedule,
  GroupScheduleDocument,
} from '../../group-schedules/entities/group-schedule.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../../academic-periods/entities/academic-period.entity';
import {
  StudentScheduleDto,
  DailyScheduleDto,
  ClassScheduleDto,
  AcademicHistoryDto,
  CourseHistoryDto,
} from '../dto/schedule.dto';
import { AcademicTrafficLightService } from './academic-traffic-light.service';
import { empty } from 'rxjs';

/**
 * Service responsible for retrieving and formatting student schedules and academic history.
 * Provides methods to get the current schedule, academic history, and historical schedules
 * for specific periods. Integrates with Mongoose models for students, enrollments, groups,
 * courses, schedules, and academic periods.
 */
@Injectable()
export class StudentScheduleService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(CourseGroup.name)
    private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(GroupSchedule.name)
    private groupScheduleModel: Model<GroupScheduleDocument>,
    @InjectModel(AcademicPeriod.name)
    private academicPeriodModel: Model<AcademicPeriodDocument>,
    private academicTrafficLightService: AcademicTrafficLightService,
  ) {}

  /**
   * Retrieves the current academic schedule for a student in the active academic period.
   * Groups classes by day and merges consecutive classes of the same course.
   * @param studentId - The external ID of the student.
   * @returns StudentScheduleDto containing student info and daily schedule.
   * @throws Error if the student or active period is not found.
   */
  async getCurrentSchedule(studentId: string): Promise<StudentScheduleDto> {
    const student = await this.studentModel.findOne({ externalId: studentId }).exec();
    if (!student) {
      throw new Error('Student not found');
    }

    const activePeriod = await this.academicPeriodModel
      .findOne({ isActive: true })
      .exec();
    if (!activePeriod) {
      throw new Error('No active academic period found');
    }

    const enrollments = await this.enrollmentModel
      .find({
        studentId: student._id,
        status: EnrollmentStatus.ENROLLED,
      })
      .populate({
        path: 'groupId',
        populate: [{ path: 'courseId' }, { path: 'periodId' }],
      })
      .exec();

    const currentPeriodEnrollments = enrollments.filter(
      (enrollment) =>
        (enrollment.groupId as any).periodId._id.toString() ===
        (activePeriod as any)._id.toString(),
    );

    if (currentPeriodEnrollments.length === 0) {
      return {
        studentId: student.code,
        studentName: `${student.firstName} ${student.lastName}`,
        currentSemester: student.currentSemester || 1,
        period: activePeriod.code,
        schedule: [],
      };
    }

    const scheduleMap = new Map<number, ClassScheduleDto[]>();

    for (const enrollment of currentPeriodEnrollments) {
      const group = enrollment.groupId as any;
      const course = group.courseId;

      const groupSchedules = await this.groupScheduleModel
        .find({ groupId: group._id })
        .exec();

      for (const schedule of groupSchedules) {
        if (!scheduleMap.has(schedule.dayOfWeek)) {
          scheduleMap.set(schedule.dayOfWeek, []);
        }

        scheduleMap.get(schedule.dayOfWeek)?.push({
          courseCode: course.code,
          courseName: course.name,
          groupNumber: group.groupNumber,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room || 'Por asignar',
          professorName: undefined,
        });
      }
    }

    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const schedule: DailyScheduleDto[] = [];

    for (let day = 1; day <= 7; day++) {
      const classes = scheduleMap.get(day) || [];
      if (classes.length > 0) {
        classes.sort((a, b) => a.startTime.localeCompare(b.startTime));

        const groupedClasses = this.groupConsecutiveClasses(classes);

        schedule.push({
          dayOfWeek: day,
          dayName: daysOfWeek[day],
          classes: groupedClasses,
        });
      }
    }

    return {
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      currentSemester: student.currentSemester || 1,
      period: activePeriod.code,
      schedule,
    };
  }

  /**
   * Groups consecutive classes of the same course into a single time block.
   * @param classes - Array of ClassScheduleDto objects for a day.
   * @returns Array of grouped ClassScheduleDto objects.
   */
  private groupConsecutiveClasses(
    classes: ClassScheduleDto[],
  ): ClassScheduleDto[] {
    if (classes.length <= 1) return classes;

    const grouped: ClassScheduleDto[] = [];
    let currentGroup = classes[0];

    for (let i = 1; i < classes.length; i++) {
      const nextClass = classes[i];

      if (
        currentGroup.courseCode === nextClass.courseCode &&
        currentGroup.endTime === nextClass.startTime
      ) {
        currentGroup.endTime = nextClass.endTime;
      } else {
        grouped.push(currentGroup);
        currentGroup = nextClass;
      }
    }

    grouped.push(currentGroup);
    return grouped;
  }

  /**
   * Retrieves the complete academic history for a student, including passed, current, and failed courses.
   * Each course includes period, grade, status, and a traffic light color.
   * @param studentId - The external ID of the student.
   * @returns AcademicHistoryDto with categorized course history.
   * @throws Error if the student is not found.
   */
  async getStudentAcademicHistory(
    studentId: string,
  ): Promise<AcademicHistoryDto> {
    const student = await this.studentModel.findOne({ externalId: studentId }).exec();
    if (!student) {
      throw new Error('Student not found');
    }

    const allEnrollments = await this.enrollmentModel
      .find({ studentId: student._id })
      .populate({
        path: 'groupId',
        populate: [{ path: 'courseId' }, { path: 'periodId' }],
      })
      .exec();

    const passedCourses: CourseHistoryDto[] = [];
    const currentCourses: CourseHistoryDto[] = [];
    const failedCourses: CourseHistoryDto[] = [];

    for (const enrollment of allEnrollments) {
      const group = enrollment.groupId as any;
      const course = group.courseId;
      const period = group.periodId;

      const courseHistory: CourseHistoryDto = {
        periodCode: period.code,
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        grade: enrollment.grade,
        status: enrollment.status,
        color: this.academicTrafficLightService.getTrafficLightColor(
          enrollment.status,
          enrollment.grade,
        ),
      };

      switch (enrollment.status) {
        case EnrollmentStatus.PASSED:
          passedCourses.push(courseHistory);
          break;
        case EnrollmentStatus.ENROLLED:
          currentCourses.push(courseHistory);
          break;
        case EnrollmentStatus.FAILED:
          failedCourses.push(courseHistory);
          break;
      }
    }

    return {
      studentId: student.code,
      currentSemester: student.currentSemester || 1,
      academicHistory: {
        passedCourses: passedCourses.sort((a, b) =>
          a.periodCode.localeCompare(b.periodCode),
        ),
        currentCourses: currentCourses.sort((a, b) =>
          a.courseCode.localeCompare(b.courseCode),
        ),
        failedCourses: failedCourses.sort((a, b) =>
          a.periodCode.localeCompare(b.periodCode),
        ),
      },
    };
  }

  /**
   * Retrieves a list of closed academic periods in which the student has enrollments.
   * Can be filtered by date range.
   * @param studentId - The external ID of the student.
   * @param fromDate - (Optional) Start date filter for periods.
   * @param toDate - (Optional) End date filter for periods.
   * @returns Object with student code, periods with enrollments, and filter info.
   * @throws Error if the student is not found or date range is invalid.
   */
  async getHistoricalSchedules(
    studentId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<any> {
    const student = await this.studentModel.findOne({ externalId: studentId }).exec();
    if (!student) {
      throw new Error('Student not found');
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (from >= to) {
        throw new Error('From date must be before to date');
      }
    }

    const periodQuery: any = { status: 'CLOSED' };

    if (fromDate || toDate) {
      periodQuery.startDate = {};
      if (fromDate) {
        periodQuery.startDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        periodQuery.startDate.$lte = new Date(toDate);
      }
    }

    const closedPeriods = await this.academicPeriodModel
      .find(periodQuery)
      .sort({ startDate: -1 })
      .exec();

    const periodsWithEnrollments: any[] = [];

    for (const period of closedPeriods) {
      const enrollments = await this.enrollmentModel
        .find({ studentId: student._id })
        .populate({
          path: 'groupId',
          match: { periodId: period._id },
          populate: [{ path: 'courseId' }, { path: 'periodId' }],
        })
        .exec();

      const validEnrollments = enrollments.filter((e) => e.groupId);

      if (validEnrollments.length > 0) {
        periodsWithEnrollments.push({
          periodId: period._id,
          periodCode: period.code,
          periodName: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          status: period.status,
          enrollmentCount: validEnrollments.length,
        });
      }
    }

      if (periodsWithEnrollments.length === 0) {
    return {
      studentId: student.code,
      periods: [],
      emptyHistory: true,
      message: 'No historical academic records found',
      filters: { from: fromDate, to: toDate }
    };
  }

    return {
      studentId: student.code,
      periods: periodsWithEnrollments,
      emptyHistory: false, 
      total: periodsWithEnrollments.length, 
      filters: { from: fromDate, to: toDate }
    };
  }

  /**
   * Retrieves the detailed schedule and course results for a student in a specific closed period.
   * @param studentId - The external ID of the student.
   * @param periodId - The ID of the academic period.
   * @returns Object with student info, period details, daily schedule, and course results.
   * @throws Error if the student or period is not found, or if the period is not closed.
   */
  async getHistoricalScheduleByPeriod(
    studentId: string,
    periodId: string,
  ): Promise<any> {
    const student = await this.studentModel.findOne({ externalId: studentId }).exec();
    if (!student) {
      throw new Error('Student not found');
    }

    const period = await this.academicPeriodModel.findById(periodId).exec();
    if (!period) {
      throw new Error('Period not found');
    }

    if (period.status !== 'CLOSED') {
      console.warn(`[AUDIT] Attempt to access open period`, {
      periodId,
      studentId: student.externalId,
      periodStatus: period.status,
      timestamp: new Date().toISOString()
    });
      throw new Error('Cannot access schedules from active periods. Only closed periods are allowed.');
    }

    const enrollments = await this.enrollmentModel
      .find({ studentId: student._id })
      .populate({
        path: 'groupId',
        match: { periodId: period._id },
        populate: [{ path: 'courseId' }, { path: 'periodId' }],
      })
      .exec();

    const validEnrollments = enrollments.filter((e) => e.groupId);
    
      if (validEnrollments.length === 0) {
    return {
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      period: {
        id: period._id,
        code: period.code,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
      },
      schedule: [],
      coursesWithResults: [],
      emptyHistory: true, 
      message: 'No enrollments found for this period' // AGREGAR
    };
  }
    
    const scheduleMap = new Map<number, any[]>();
    const coursesWithResults: any[] = [];

    for (const enrollment of validEnrollments) {
      const group = enrollment.groupId as any;
      const course = group.courseId;

      coursesWithResults.push({
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        groupNumber: group.groupNumber,
        finalGrade: enrollment.grade,
        status: enrollment.status,
        classroom: group.classroom || 'Por asignar',
      });

      const groupSchedules = await this.groupScheduleModel
        .find({ groupId: group._id })
        .exec();

      for (const schedule of groupSchedules) {
        if (!scheduleMap.has(schedule.dayOfWeek)) {
          scheduleMap.set(schedule.dayOfWeek, []);
        }

        scheduleMap.get(schedule.dayOfWeek)?.push({
          courseCode: course.code,
          courseName: course.name,
          groupNumber: group.groupNumber,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room || 'Por asignar',
        });
      }
    }

    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const schedule: any[] = [];

    for (let day = 1; day <= 7; day++) {
      const classes = scheduleMap.get(day) || [];
      if (classes.length > 0) {
        classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
        schedule.push({
          dayOfWeek: day,
          dayName: daysOfWeek[day],
          classes,
        });
      }
    }

    return {
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      period: {
        id: period._id,
        code: period.code,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
      },
      schedule,
      coursesWithResults,
      emptyHistory: false,
      isHistorical: true
    };
  }
}
