import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroupSchedule, GroupScheduleDocument } from '../../group-schedules/entities/group-schedule.entity';
import { CourseGroup, CourseGroupDocument } from '../../course-groups/entities/course-group.entity';
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from '../../enrollments/entities/enrollment.entity';
import { AcademicPeriod, AcademicPeriodDocument } from '../../academic-periods/entities/academic-period.entity';
import { TimeSlot, ValidationResult, ScheduleConflict } from '../interfaces/schedule.interface';

@Injectable()
export class ScheduleValidationService {
  constructor(
    @InjectModel(GroupSchedule.name) private groupScheduleModel: Model<GroupScheduleDocument>,
    @InjectModel(CourseGroup.name) private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(AcademicPeriod.name) private academicPeriodModel: Model<AcademicPeriodDocument>,
  ) {}

  async validateChangeRequest(
    studentId: string,
    sourceGroupId: string,
    targetGroupId: string
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      const periodValidation = await this.validateActivePeriod();
      if (!periodValidation.isValid) {
        result.errors.push(...periodValidation.errors);
        result.isValid = false;
      }

      const spotValidation = await this.validateAvailableSpots(targetGroupId);
      if (!spotValidation.isValid) {
        result.errors.push(...spotValidation.errors);
        result.isValid = false;
      }

      const scheduleValidation = await this.validateScheduleConflicts(
        studentId,
        sourceGroupId,
        targetGroupId
      );
      if (!scheduleValidation.isValid) {
        result.errors.push(...scheduleValidation.errors);
        result.isValid = false;
      }

      const enrollmentValidation = await this.validateStudentEnrollment(studentId, sourceGroupId);
      if (!enrollmentValidation.isValid) {
        result.errors.push(...enrollmentValidation.errors);
        result.isValid = false;
      }

      const sameJourseValidation = await this.validateSameCourse(sourceGroupId, targetGroupId);
      if (!sameJourseValidation.isValid) {
        result.errors.push(...sameJourseValidation.errors);
        result.isValid = false;
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  async validateActivePeriod(): Promise<ValidationResult> {
    const activePeriod = await this.academicPeriodModel.findOne({
      isActive: true,
      allowChangeRequests: true
    }).exec();

    if (!activePeriod) {
      return {
        isValid: false,
        errors: ['No active academic period that allows change requests'],
        warnings: []
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  async validateAvailableSpots(groupId: string): Promise<ValidationResult> {
    const group = await this.courseGroupModel.findById(groupId).exec();
    if (!group) {
      return {
        isValid: false,
        errors: ['Group not found'],
        warnings: []
      };
    }

    const currentEnrollments = await this.enrollmentModel.countDocuments({
      groupId: groupId,
      status: EnrollmentStatus.ENROLLED
    }).exec();

    if (currentEnrollments >= group.maxStudents) {
      return {
        isValid: false,
        errors: ['Target group has no available spots'],
        warnings: []
      };
    }

    const warnings: string[] = [];
    if (currentEnrollments >= group.maxStudents * 0.9) {
      warnings.push('Target group is near capacity limit');
    }

    return {
      isValid: true,
      errors: [],
      warnings
    };
  }

  async validateScheduleConflicts(
    studentId: string,
    sourceGroupId: string,
    targetGroupId: string
  ): Promise<ValidationResult> {
    const studentEnrollments = await this.enrollmentModel
      .find({
        studentId,
        status: EnrollmentStatus.ENROLLED,
        groupId: { $ne: sourceGroupId }
      })
      .exec();

    const studentSchedules: TimeSlot[] = [];
    for (const enrollment of studentEnrollments) {
      const schedules = await this.groupScheduleModel
        .find({ groupId: enrollment.groupId })
        .exec();

      for (const schedule of schedules) {
        studentSchedules.push({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          groupId: enrollment.groupId.toString()
        });
      }
    }

    const targetSchedules = await this.groupScheduleModel
      .find({ groupId: targetGroupId })
      .exec();

    const targetTimeSlots: TimeSlot[] = targetSchedules.map(schedule => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      groupId: targetGroupId
    }));

    const conflicts = this.checkTimeConflicts(studentSchedules, targetTimeSlots);

    if (conflicts.length > 0) {
      return {
        isValid: false,
        errors: conflicts.map(conflict =>
          `Schedule conflict: ${conflict.day} from ${conflict.time1} to ${conflict.time2}`
        ),
        warnings: []
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  async validateStudentEnrollment(studentId: string, groupId: string): Promise<ValidationResult> {
    const enrollment = await this.enrollmentModel.findOne({
      studentId,
      groupId,
      status: EnrollmentStatus.ENROLLED
    }).exec();

    if (!enrollment) {
      return {
        isValid: false,
        errors: ['Student is not enrolled in the source group'],
        warnings: []
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  async validateSameCourse(sourceGroupId: string, targetGroupId: string): Promise<ValidationResult> {
    const sourceGroup = await this.courseGroupModel.findById(sourceGroupId).exec();
    const targetGroup = await this.courseGroupModel.findById(targetGroupId).exec();

    if (!sourceGroup || !targetGroup) {
      return {
        isValid: false,
        errors: ['One or both groups do not exist'],
        warnings: []
      };
    }

    if (sourceGroup.courseId !== targetGroup.courseId) {
      return {
        isValid: false,
        errors: ['Groups must be from the same course'],
        warnings: []
      };
    }

    if (sourceGroup.periodId !== targetGroup.periodId) {
      return {
        isValid: false,
        errors: ['Groups must be from the same academic period'],
        warnings: []
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  private checkTimeConflicts(
    currentSchedules: TimeSlot[],
    newSchedules: TimeSlot[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const newSlot of newSchedules) {
      for (const currentSlot of currentSchedules) {
        if (newSlot.dayOfWeek === currentSlot.dayOfWeek) {
          if (this.timeOverlaps(
            newSlot.startTime,
            newSlot.endTime,
            currentSlot.startTime,
            currentSlot.endTime
          )) {
            conflicts.push({
              day: daysOfWeek[newSlot.dayOfWeek],
              time1: newSlot.startTime,
              time2: newSlot.endTime
            });
          }
        }
      }
    }

    return conflicts;
  }

  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    const parseTime = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = parseTime(start1);
    const end1Min = parseTime(end1);
    const start2Min = parseTime(start2);
    const end2Min = parseTime(end2);

    return start1Min < end2Min && start2Min < end1Min;
  }

  async getGroupSchedule(groupId: string): Promise<TimeSlot[]> {
    const schedules = await this.groupScheduleModel.find({ groupId }).exec();
    return schedules.map(schedule => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      groupId
    }));
  }
}