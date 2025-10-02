import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GroupSchedule,
  GroupScheduleDocument,
} from '../../group-schedules/entities/group-schedule.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../../course-groups/entities/course-group.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../../enrollments/entities/enrollment.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../../academic-periods/entities/academic-period.entity';
import {
  TimeSlot,
  ValidationResult,
  ScheduleConflict,
} from '../interfaces/schedule.interface';

/**
 * Service for validating schedule changes, detecting conflicts, and ensuring academic rules.
 * Provides methods to validate change requests, check for available spots, schedule conflicts,
 * enrollment status, and period status.
 */
@Injectable()
export class ScheduleValidationService {
  constructor(
    @InjectModel(GroupSchedule.name)
    private groupScheduleModel: Model<GroupScheduleDocument>,
    @InjectModel(CourseGroup.name)
    private courseGroupModel: Model<CourseGroupDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(AcademicPeriod.name)
    private academicPeriodModel: Model<AcademicPeriodDocument>,
  ) {}

  /**
   * Validates a student's request to change from one group to another.
   * Checks active period, available spots, schedule conflicts, enrollment, and course match.
   * @param studentId - The student's ID.
   * @param sourceGroupId - The current group ID.
   * @param targetGroupId - The target group ID.
   * @returns ValidationResult with errors and warnings if any.
   */
  async validateChangeRequest(
    studentId: string,
    sourceGroupId: string,
    targetGroupId: string,
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
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
        targetGroupId,
      );
      if (!scheduleValidation.isValid) {
        result.errors.push(...scheduleValidation.errors);
        result.isValid = false;
      }

      const enrollmentValidation = await this.validateStudentEnrollment(
        studentId,
        sourceGroupId,
      );
      if (!enrollmentValidation.isValid) {
        result.errors.push(...enrollmentValidation.errors);
        result.isValid = false;
      }

      const sameJourseValidation = await this.validateSameCourse(
        sourceGroupId,
        targetGroupId,
      );
      if (!sameJourseValidation.isValid) {
        result.errors.push(...sameJourseValidation.errors);
        result.isValid = false;
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Validates if there is an active academic period that allows change requests.
   * @returns ValidationResult indicating if the period is valid.
   */
  async validateActivePeriod(): Promise<ValidationResult> {
    const activePeriod = await this.academicPeriodModel
      .findOne({
        isActive: true,
        allowChangeRequests: true,
      })
      .exec();

    if (!activePeriod) {
      return {
        isValid: false,
        errors: ['No active academic period that allows change requests'],
        warnings: [],
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Validates if the target group has available spots for enrollment.
   * Adds a warning if the group is near capacity.
   * @param groupId - The group ID to check.
   * @returns ValidationResult with errors or warnings.
   */
  async validateAvailableSpots(groupId: string): Promise<ValidationResult> {
    const group = await this.courseGroupModel.findById(groupId).exec();
    if (!group) {
      return {
        isValid: false,
        errors: ['Group not found'],
        warnings: [],
      };
    }

    const currentEnrollments = await this.enrollmentModel
      .countDocuments({
        groupId: groupId,
        status: EnrollmentStatus.ENROLLED,
      })
      .exec();

    if (currentEnrollments >= group.maxStudents) {
      return {
        isValid: false,
        errors: ['Target group has no available spots'],
        warnings: [],
      };
    }

    const warnings: string[] = [];
    if (currentEnrollments >= group.maxStudents * 0.9) {
      warnings.push('Target group is near capacity limit');
    }

    return {
      isValid: true,
      errors: [],
      warnings,
    };
  }

  /**
   * Validates if moving to the target group would cause schedule conflicts for the student.
   * @param studentId - The student's ID.
   * @param sourceGroupId - The current group ID.
   * @param targetGroupId - The target group ID.
   * @returns ValidationResult with conflict errors if any.
   */
  async validateScheduleConflicts(
    studentId: string,
    sourceGroupId: string,
    targetGroupId: string,
  ): Promise<ValidationResult> {
    const studentEnrollments = await this.enrollmentModel
      .find({
        studentId,
        status: EnrollmentStatus.ENROLLED,
        groupId: { $ne: sourceGroupId },
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
          groupId: enrollment.groupId.toString(),
        });
      }
    }

    const targetSchedules = await this.groupScheduleModel
      .find({ groupId: targetGroupId })
      .exec();

    const targetTimeSlots: TimeSlot[] = targetSchedules.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      groupId: targetGroupId,
    }));

    const conflicts = this.checkTimeConflicts(
      studentSchedules,
      targetTimeSlots,
    );

    if (conflicts.length > 0) {
      return {
        isValid: false,
        errors: conflicts.map(
          (conflict) =>
            `Schedule conflict: ${conflict.day} from ${conflict.time1} to ${conflict.time2}`,
        ),
        warnings: [],
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Validates if the student is currently enrolled in the source group.
   * @param studentId - The student's ID.
   * @param groupId - The group ID.
   * @returns ValidationResult indicating enrollment status.
   */
  async validateStudentEnrollment(
    studentId: string,
    groupId: string,
  ): Promise<ValidationResult> {
    const enrollment = await this.enrollmentModel
      .findOne({
        studentId,
        groupId,
        status: EnrollmentStatus.ENROLLED,
      })
      .exec();

    if (!enrollment) {
      return {
        isValid: false,
        errors: ['Student is not enrolled in the source group'],
        warnings: [],
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Validates that both source and target groups belong to the same course and academic period.
   * @param sourceGroupId - The current group ID.
   * @param targetGroupId - The target group ID.
   * @returns ValidationResult with errors if groups do not match.
   */
  async validateSameCourse(
    sourceGroupId: string,
    targetGroupId: string,
  ): Promise<ValidationResult> {
    const sourceGroup = await this.courseGroupModel
      .findById(sourceGroupId)
      .exec();
    const targetGroup = await this.courseGroupModel
      .findById(targetGroupId)
      .exec();

    if (!sourceGroup || !targetGroup) {
      return {
        isValid: false,
        errors: ['One or both groups do not exist'],
        warnings: [],
      };
    }

    if (sourceGroup.courseId !== targetGroup.courseId) {
      return {
        isValid: false,
        errors: ['Groups must be from the same course'],
        warnings: [],
      };
    }

    if (sourceGroup.periodId !== targetGroup.periodId) {
      return {
        isValid: false,
        errors: ['Groups must be from the same academic period'],
        warnings: [],
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Checks for time conflicts between two sets of time slots.
   * @param currentSchedules - The student's current time slots.
   * @param newSchedules - The new group's time slots.
   * @returns Array of ScheduleConflict objects if conflicts are found.
   */
  private checkTimeConflicts(
    currentSchedules: TimeSlot[],
    newSchedules: TimeSlot[],
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    for (const newSlot of newSchedules) {
      for (const currentSlot of currentSchedules) {
        if (newSlot.dayOfWeek === currentSlot.dayOfWeek) {
          if (
            this.timeOverlaps(
              newSlot.startTime,
              newSlot.endTime,
              currentSlot.startTime,
              currentSlot.endTime,
            )
          ) {
            conflicts.push({
              day: daysOfWeek[newSlot.dayOfWeek],
              time1: newSlot.startTime,
              time2: newSlot.endTime,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Determines if two time intervals overlap.
   * @param start1 - Start time of the first interval.
   * @param end1 - End time of the first interval.
   * @param start2 - Start time of the second interval.
   * @param end2 - End time of the second interval.
   * @returns True if intervals overlap, false otherwise.
   */
  private timeOverlaps(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
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

  /**
   * Detects schedule conflicts within a student's schedule for all days.
   * Used to find overlapping classes in the current schedule.
   * @param schedule - Array of daily schedules with classes.
   * @returns Array of conflict objects with details.
   */
  async detectScheduleConflicts(schedule: any[]): Promise<any[]> {
    const conflicts: any[] = [];
    const daysOfWeek = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    for (const day of schedule) {
      const classes = day.classes;
      if (classes.length <= 1) continue;

      for (let i = 0; i < classes.length - 1; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          const class1 = classes[i];
          const class2 = classes[j];

          if (
            this.timeOverlaps(
              class1.startTime,
              class1.endTime,
              class2.startTime,
              class2.endTime,
            )
          ) {
            conflicts.push({
              day: day.dayName,
              dayOfWeek: day.dayOfWeek,
              course1: {
                code: class1.courseCode,
                name: class1.courseName,
                group: class1.groupNumber,
                time: `${class1.startTime} - ${class1.endTime}`,
                room: class1.room,
              },
              course2: {
                code: class2.courseCode,
                name: class2.courseName,
                group: class2.groupNumber,
                time: `${class2.startTime} - ${class2.endTime}`,
                room: class2.room,
              },
              conflictType: 'overlap',
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Validates if a given academic period is closed.
   * @param periodId - The academic period ID.
   * @returns True if the period is closed, false otherwise.
   */
  async validateClosedPeriod(periodId: string): Promise<boolean> {
    const period = await this.academicPeriodModel.findById(periodId).exec();
    return period ? (period as any).status === 'CLOSED' : false;
  }

  /**
   * Retrieves the schedule (time slots) for a specific group.
   * @param groupId - The group ID.
   * @returns Array of TimeSlot objects for the group.
   */
  async getGroupSchedule(groupId: string): Promise<TimeSlot[]> {
    const schedules = await this.groupScheduleModel.find({ groupId }).exec();
    return schedules.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      groupId,
    }));
  }
}
