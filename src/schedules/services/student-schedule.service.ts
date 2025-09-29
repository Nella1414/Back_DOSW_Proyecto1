import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../../students/entities/student.entity';
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from '../../enrollments/entities/enrollment.entity';
import { CourseGroup, CourseGroupDocument } from '../../course-groups/entities/course-group.entity';
import { Course, CourseDocument } from '../../courses/entities/course.entity';
import { GroupSchedule, GroupScheduleDocument } from '../../group-schedules/entities/group-schedule.entity';
import { AcademicPeriod, AcademicPeriodDocument } from '../../academic-periods/entities/academic-period.entity';
import { StudentScheduleDto, DailyScheduleDto, ClassScheduleDto, AcademicHistoryDto, CourseHistoryDto } from '../dto/schedule.dto';
import { AcademicTrafficLightService } from './academic-traffic-light.service';

@Injectable()
export class StudentScheduleService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(CourseGroup.name) private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(GroupSchedule.name) private groupScheduleModel: Model<GroupScheduleDocument>,
    @InjectModel(AcademicPeriod.name) private academicPeriodModel: Model<AcademicPeriodDocument>,
    private academicTrafficLightService: AcademicTrafficLightService,
  ) {}

  async getStudentSchedule(studentId: string, periodId?: string): Promise<StudentScheduleDto> {
    const student = await this.studentModel.findOne({ code: studentId }).exec();
    if (!student) {
      throw new Error('Student not found');
    }

    let activePeriod: AcademicPeriodDocument | null;
    if (periodId) {
      activePeriod = await this.academicPeriodModel.findById(periodId).exec();
    } else {
      activePeriod = await this.academicPeriodModel.findOne({ isActive: true }).exec();
    }

    if (!activePeriod) {
      throw new Error('No active academic period found');
    }

    const enrollments = await this.enrollmentModel
      .find({
        studentId: student._id,
        status: EnrollmentStatus.ENROLLED
      })
      .populate({
        path: 'groupId',
        populate: [
          { path: 'courseId' },
          { path: 'periodId' }
        ]
      })
      .exec();

    const currentPeriodEnrollments = enrollments.filter(
      enrollment => (enrollment.groupId as any).periodId._id === activePeriod._id
    );

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
          room: schedule.room,
          professorName: undefined
        });
      }
    }

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const schedule: DailyScheduleDto[] = [];

    for (let day = 1; day <= 7; day++) {
      const classes = scheduleMap.get(day) || [];
      if (classes.length > 0) {
        classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
        schedule.push({
          dayOfWeek: day,
          dayName: daysOfWeek[day],
          classes
        });
      }
    }

    return {
      studentId: student.code,
      studentName: `${student.firstName} ${student.lastName}`,
      currentSemester: student.currentSemester || 1,
      period: activePeriod.code,
      schedule
    };
  }

  async getStudentAcademicHistory(studentId: string): Promise<AcademicHistoryDto> {
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
        color: this.academicTrafficLightService.getTrafficLightColor(enrollment.status, enrollment.grade)
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
        passedCourses: passedCourses.sort((a, b) => a.periodCode.localeCompare(b.periodCode)),
        currentCourses: currentCourses.sort((a, b) => a.courseCode.localeCompare(b.courseCode)),
        failedCourses: failedCourses.sort((a, b) => a.periodCode.localeCompare(b.periodCode))
      }
    };
  }


  async getStudentCurrentEnrollments(studentId: string, periodId: string): Promise<any[]> {
    const student = await this.studentModel.findOne({ code: studentId }).exec();
    if (!student) {
      throw new Error('Student not found');
    }

    return await this.enrollmentModel
      .find({
        studentId: student._id,
        status: EnrollmentStatus.ENROLLED
      })
      .populate({
        path: 'groupId',
        match: { periodId },
        populate: [
          { path: 'courseId' },
          { path: 'periodId' }
        ]
      })
      .exec();
  }
}