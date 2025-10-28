import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
  HistoricalSchedulesResponseDto,
  HistoricalSchedulePeriodDto,
  HistoricalScheduleByPeriodResponseDto,
  AcademicPeriodInfoDto,
  CourseWithResultsDto,
} from '../dto/schedule.dto';
import { AcademicTrafficLightService } from '../../academic-traffic-light/services/academic-traffic-light.service';
import {
  PopulatedEnrollment,
  PopulatedGroup,
  PopulatedPeriod,
  PeriodQuery,
} from '../interfaces/populated-types.interface';

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

  async getCurrentSchedule(studentId: string): Promise<StudentScheduleDto> {
    // Try to find student by code first, then by externalId
    let student = await this.studentModel.findOne({ code: studentId }).exec();
    if (!student) {
      student = await this.studentModel
        .findOne({ externalId: studentId })
        .exec();
    }
    if (!student) {
      throw new NotFoundException(
        `Student with code or externalId ${studentId} not found`,
      );
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
        populate: [
          { path: 'courseId' },
          { path: 'periodId' },
          { path: 'professorId', select: 'displayName firstName lastName' },
        ],
      })
      .exec();

    const currentPeriodEnrollments = enrollments.filter((enrollment) => {
      const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
      const populatedPeriod = activePeriod as PopulatedPeriod;
      return (
        populatedEnrollment.groupId?.periodId?._id.toString() ===
        populatedPeriod._id.toString()
      );
    });

    if (currentPeriodEnrollments.length === 0) {
      return {
        _id: String(student._id),
        studentId: student.code,
        studentName: `${student.firstName} ${student.lastName}`,
        currentSemester: student.currentSemester || 1,
        periodId: String(activePeriod._id),
        period: activePeriod.code,
        schedule: [],
      };
    }

    const scheduleMap = new Map<number, ClassScheduleDto[]>();

    for (const enrollment of currentPeriodEnrollments) {
      const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
      const group = populatedEnrollment.groupId;

      if (!group || !group.courseId) {
        continue;
      }

      const course = group.courseId;

      const groupSchedules = await this.groupScheduleModel
        .find({ groupId: group._id })
        .exec();

      for (const schedule of groupSchedules) {
        if (!scheduleMap.has(schedule.dayOfWeek)) {
          scheduleMap.set(schedule.dayOfWeek, []);
        }

        // Get professor name from populated data
        const professor = (group as any).professorId;
        const professorName = professor
          ? professor.displayName ||
            `${professor.firstName || ''} ${professor.lastName || ''}`.trim() ||
            'Por asignar'
          : 'Por asignar';

        scheduleMap.get(schedule.dayOfWeek)?.push({
          courseId: String(course._id),
          courseCode: course.code,
          courseName: course.name,
          groupId: String(group._id),
          groupNumber: String(group.groupNumber),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room || 'Por asignar',
          professorName,
        });
      }
    }

    const daysOfWeek = [
      'Sunday', // 0
      'Monday', // 1
      'Tuesday', // 2
      'Wednesday', // 3
      'Thursday', // 4
      'Friday', // 5
      'Saturday', // 6
    ];
    const schedule: DailyScheduleDto[] = [];

    for (let day = 1; day <= 7; day++) {
      const classes = scheduleMap.get(day) || [];
      if (classes.length > 0) {
        classes.sort((a, b) => a.startTime.localeCompare(b.startTime));

        const groupedClasses = this.groupConsecutiveClasses(classes);

        schedule.push({
          dayOfWeek: day,
          dayName: daysOfWeek[day % 7], // Fix: day 7 (Sunday) maps to index 0, day 1 (Monday) to index 1, etc.
          classes: groupedClasses,
        });
      }
    }

    return {
      _id: String(student._id),
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      currentSemester: student.currentSemester || 1,
      periodId: String(activePeriod._id),
      period: activePeriod.code,
      schedule,
    };
  }

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

  async getStudentAcademicHistory(
    studentId: string,
  ): Promise<AcademicHistoryDto> {
    // Try to find student by code first, then by externalId
    let student = await this.studentModel.findOne({ code: studentId }).exec();
    if (!student) {
      student = await this.studentModel
        .findOne({ externalId: studentId })
        .exec();
    }
    if (!student) {
      throw new NotFoundException(
        `Student with code or externalId ${studentId} not found`,
      );
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
    let totalEarnedCredits = 0;
    let totalGradePoints = 0;
    let totalGradedCredits = 0;

    for (const enrollment of allEnrollments) {
      const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
      const group = populatedEnrollment.groupId;

      if (!group || !group.courseId || !group.periodId) {
        continue;
      }

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
          totalEarnedCredits += course.credits;
          if (enrollment.grade) {
            totalGradePoints += enrollment.grade * course.credits;
            totalGradedCredits += course.credits;
          }
          break;
        case EnrollmentStatus.ENROLLED:
          currentCourses.push(courseHistory);
          break;
        case EnrollmentStatus.FAILED:
          failedCourses.push(courseHistory);
          // Still count credits for GPA calculation on failed courses
          if (enrollment.grade) {
            totalGradePoints += enrollment.grade * course.credits;
            totalGradedCredits += course.credits;
          }
          break;
      }
    }

    // Calculate GPA
    const gpa =
      totalGradedCredits > 0
        ? Math.round((totalGradePoints / totalGradedCredits) * 100) / 100
        : 0;

    // Get program info for total courses/credits
    // For now, we'll use placeholder values - you should fetch this from the Program model
    const totalCourses = 43; // TODO: Get from program
    const totalCredits = 139; // TODO: Get from program
    const completedCourses = passedCourses.length;
    const progressPercentage =
      totalCourses > 0
        ? Math.round((completedCourses / totalCourses) * 100)
        : 0;

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
      progressPercentage,
      completedCourses,
      totalCourses,
      earnedCredits: totalEarnedCredits,
      totalCredits,
      gpa,
      programName: 'Ingeniería de Sistemas', // TODO: Get from program
    };
  }

  async getHistoricalSchedules(
    studentId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<HistoricalSchedulesResponseDto> {
    // Try to find student by code first, then by externalId
    let student = await this.studentModel.findOne({ code: studentId }).exec();
    if (!student) {
      student = await this.studentModel
        .findOne({ externalId: studentId })
        .exec();
    }
    if (!student) {
      throw new NotFoundException(
        `Student with code or externalId ${studentId} not found`,
      );
    }

    const periodQuery: PeriodQuery = { status: 'CLOSED' };

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

    const periodsWithEnrollments: HistoricalSchedulePeriodDto[] = [];

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
        let passedCount = 0;
        let failedCount = 0;
        let totalGradePoints = 0;
        let totalCredits = 0;

        for (const enrollment of validEnrollments) {
          const populatedEnrollment =
            enrollment as unknown as PopulatedEnrollment;
          if (enrollment.status === EnrollmentStatus.PASSED) {
            passedCount++;
            if (
              enrollment.grade &&
              populatedEnrollment.groupId?.courseId?.credits
            ) {
              totalGradePoints +=
                enrollment.grade * populatedEnrollment.groupId.courseId.credits;
              totalCredits += populatedEnrollment.groupId.courseId.credits;
            }
          } else if (enrollment.status === EnrollmentStatus.FAILED) {
            failedCount++;
          }
        }

        const semesterGPA =
          totalCredits > 0
            ? Math.round((totalGradePoints / totalCredits) * 100) / 100
            : 0;

        periodsWithEnrollments.push({
          periodId: String(period._id),
          periodCode: period.code,
          periodName: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          coursesEnrolled: validEnrollments.length,
          coursesPassed: passedCount,
          coursesFailed: failedCount,
          semesterGPA,
          status: period.status,
        });
      }
    }

    if (periodsWithEnrollments.length === 0) {
      return {
        studentId: student.code,
        studentName: `${student.firstName} ${student.lastName}`,
        currentSemester: student.currentSemester || 1,
        periods: [],
      };
    }

    return {
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      currentSemester: student.currentSemester || 1,
      periods: periodsWithEnrollments,
    };
  }

  async getHistoricalScheduleByPeriod(
    studentId: string,
    periodId: string,
  ): Promise<HistoricalScheduleByPeriodResponseDto> {
    // Try to find student by code first, then by externalId
    let student = await this.studentModel.findOne({ code: studentId }).exec();
    if (!student) {
      student = await this.studentModel
        .findOne({ externalId: studentId })
        .exec();
    }
    if (!student) {
      throw new NotFoundException(
        `Student with code or externalId ${studentId} not found`,
      );
    }

    const period = await this.academicPeriodModel.findById(periodId).exec();
    if (!period) {
      throw new NotFoundException(`Period with ID ${periodId} not found`);
    }

    if (period.status !== 'CLOSED') {
      throw new BadRequestException('Period is not closed');
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
          id: String(period._id),
          code: period.code,
          name: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          status: period.status,
        },
        schedule: [],
        courses: [],
      };
    }

    const scheduleMap = new Map<number, ClassScheduleDto[]>();
    const coursesWithResults: CourseWithResultsDto[] = [];

    for (const enrollment of validEnrollments) {
      const populatedEnrollment = enrollment as unknown as PopulatedEnrollment;
      const group = populatedEnrollment.groupId;

      if (!group || !group.courseId) {
        continue;
      }

      const course = group.courseId;

      coursesWithResults.push({
        courseId: String(course._id),
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        groupId: String(group._id),
        groupNumber: group.groupNumber,
        finalGrade: enrollment.grade,
        status: enrollment.status,
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
          groupNumber: String(group.groupNumber),
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
    const schedule: DailyScheduleDto[] = [];

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
        code: period.code,
        name: period.name,
      },
      schedule,
      courses: coursesWithResults,
    };
  }
}
