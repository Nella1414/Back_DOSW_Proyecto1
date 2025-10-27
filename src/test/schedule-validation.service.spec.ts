import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScheduleValidationService } from '../schedules/services/schedule-validation.service';
import {
  GroupSchedule,
  GroupScheduleDocument,
} from '../group-schedules/entities/group-schedule.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../course-groups/entities/course-group.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../academic-periods/entities/academic-period.entity';
import { ValidationResult, TimeSlot } from '../schedules/interfaces/schedule.interface';

describe('ScheduleValidationService', () => {
  let service: ScheduleValidationService;
  let groupScheduleModel: Model<GroupScheduleDocument>;
  let courseGroupModel: Model<CourseGroupDocument>;
  let enrollmentModel: Model<EnrollmentDocument>;
  let academicPeriodModel: Model<AcademicPeriodDocument>;

  const mockStudentId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockSourceGroupId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockTargetGroupId = '60d5ecb8b0a7c4b4b8b9b1a3';
  const mockCourseId = '60d5ecb8b0a7c4b4b8b9b1a4';
  const mockPeriodId = '60d5ecb8b0a7c4b4b8b9b1a5';

  const mockActivePeriod = {
    _id: mockPeriodId,
    code: '2024-2',
    name: 'Segundo Semestre 2024',
    isActive: true,
    allowChangeRequests: true,
    status: 'ACTIVE',
  };

  const mockSourceGroup = {
    _id: mockSourceGroupId,
    courseId: mockCourseId,
    periodId: mockPeriodId,
    groupNumber: 'A',
    maxStudents: 30,
    currentEnrollments: 20,
  };

  const mockTargetGroup = {
    _id: mockTargetGroupId,
    courseId: mockCourseId,
    periodId: mockPeriodId,
    groupNumber: 'B',
    maxStudents: 30,
    currentEnrollments: 15,
  };

  const mockEnrollment = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a6',
    studentId: mockStudentId,
    groupId: mockSourceGroupId,
    status: EnrollmentStatus.ENROLLED,
  };

  const mockSchedule1 = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a7',
    groupId: mockSourceGroupId,
    dayOfWeek: 1, // Monday
    startTime: '08:00',
    endTime: '10:00',
    room: 'Aula 101',
  };

  const mockSchedule2 = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a8',
    groupId: mockTargetGroupId,
    dayOfWeek: 1, // Monday
    startTime: '10:00',
    endTime: '12:00',
    room: 'Aula 102',
  };

  const mockGroupScheduleModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockCourseGroupModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockEnrollmentModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockAcademicPeriodModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleValidationService,
        {
          provide: getModelToken(GroupSchedule.name),
          useValue: mockGroupScheduleModel,
        },
        {
          provide: getModelToken(CourseGroup.name),
          useValue: mockCourseGroupModel,
        },
        {
          provide: getModelToken(Enrollment.name),
          useValue: mockEnrollmentModel,
        },
        {
          provide: getModelToken(AcademicPeriod.name),
          useValue: mockAcademicPeriodModel,
        },
      ],
    }).compile();

    service = module.get<ScheduleValidationService>(ScheduleValidationService);
    groupScheduleModel = module.get<Model<GroupScheduleDocument>>(
      getModelToken(GroupSchedule.name),
    );
    courseGroupModel = module.get<Model<CourseGroupDocument>>(
      getModelToken(CourseGroup.name),
    );
    enrollmentModel = module.get<Model<EnrollmentDocument>>(
      getModelToken(Enrollment.name),
    );
    academicPeriodModel = module.get<Model<AcademicPeriodDocument>>(
      getModelToken(AcademicPeriod.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateActivePeriod', () => {
    it('should return valid when active period exists and allows change requests', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(mockActivePeriod),
      };
      (academicPeriodModel.findOne as jest.Mock).mockReturnValue(execChain);

      const result = await service.validateActivePeriod();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(academicPeriodModel.findOne).toHaveBeenCalledWith({
        isActive: true,
        allowChangeRequests: true,
      });
    });

    it('should return invalid when no active period exists', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(null),
      };
      (academicPeriodModel.findOne as jest.Mock).mockReturnValue(execChain);

      const result = await service.validateActivePeriod();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No active academic period that allows change requests');
    });
  });

  describe('validateAvailableSpots', () => {
    it('should return valid when group has available spots', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(mockTargetGroup),
      };
      (courseGroupModel.findById as jest.Mock).mockReturnValue(execChain);

      const countChain = {
        exec: jest.fn().mockResolvedValue(15),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const result = await service.validateAvailableSpots(mockTargetGroupId);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when group is full', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(mockTargetGroup),
      };
      (courseGroupModel.findById as jest.Mock).mockReturnValue(execChain);

      const countChain = {
        exec: jest.fn().mockResolvedValue(30),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const result = await service.validateAvailableSpots(mockTargetGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Target group has no available spots');
    });

    it('should return warning when group is near capacity', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(mockTargetGroup),
      };
      (courseGroupModel.findById as jest.Mock).mockReturnValue(execChain);

      const countChain = {
        exec: jest.fn().mockResolvedValue(27), // 90% of 30
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const result = await service.validateAvailableSpots(mockTargetGroupId);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Target group is near capacity limit');
    });

    it('should return invalid when group not found', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(null),
      };
      (courseGroupModel.findById as jest.Mock).mockReturnValue(execChain);

      const result = await service.validateAvailableSpots(mockTargetGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Group not found');
    });
  });

  describe('validateStudentEnrollment', () => {
    it('should return valid when student is enrolled in source group', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(mockEnrollment),
      };
      (enrollmentModel.findOne as jest.Mock).mockReturnValue(execChain);

      const result = await service.validateStudentEnrollment(mockStudentId, mockSourceGroupId);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(enrollmentModel.findOne).toHaveBeenCalledWith({
        studentId: mockStudentId,
        groupId: mockSourceGroupId,
        status: EnrollmentStatus.ENROLLED,
      });
    });

    it('should return invalid when student is not enrolled', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(null),
      };
      (enrollmentModel.findOne as jest.Mock).mockReturnValue(execChain);

      const result = await service.validateStudentEnrollment(mockStudentId, mockSourceGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Student is not enrolled in the source group');
    });
  });

  describe('validateSameCourse', () => {
    it('should return valid when groups are from same course and period', async () => {
      const sourceExec = {
        exec: jest.fn().mockResolvedValue(mockSourceGroup),
      };
      const targetExec = {
        exec: jest.fn().mockResolvedValue(mockTargetGroup),
      };
      
      (courseGroupModel.findById as jest.Mock)
        .mockReturnValueOnce(sourceExec)
        .mockReturnValueOnce(targetExec);

      const result = await service.validateSameCourse(mockSourceGroupId, mockTargetGroupId);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when groups are from different courses', async () => {
      const differentCourseGroup = {
        ...mockTargetGroup,
        courseId: 'different-course-id',
      };
      
      const sourceExec = {
        exec: jest.fn().mockResolvedValue(mockSourceGroup),
      };
      const targetExec = {
        exec: jest.fn().mockResolvedValue(differentCourseGroup),
      };
      
      (courseGroupModel.findById as jest.Mock)
        .mockReturnValueOnce(sourceExec)
        .mockReturnValueOnce(targetExec);

      const result = await service.validateSameCourse(mockSourceGroupId, mockTargetGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Groups must be from the same course');
    });

    it('should return invalid when groups are from different periods', async () => {
      const differentPeriodGroup = {
        ...mockTargetGroup,
        periodId: 'different-period-id',
      };
      
      const sourceExec = {
        exec: jest.fn().mockResolvedValue(mockSourceGroup),
      };
      const targetExec = {
        exec: jest.fn().mockResolvedValue(differentPeriodGroup),
      };
      
      (courseGroupModel.findById as jest.Mock)
        .mockReturnValueOnce(sourceExec)
        .mockReturnValueOnce(targetExec);

      const result = await service.validateSameCourse(mockSourceGroupId, mockTargetGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Groups must be from the same academic period');
    });

    it('should return invalid when source group does not exist', async () => {
      const sourceExec = {
        exec: jest.fn().mockResolvedValue(null),
      };
      const targetExec = {
        exec: jest.fn().mockResolvedValue(mockTargetGroup),
      };
      
      (courseGroupModel.findById as jest.Mock)
        .mockReturnValueOnce(sourceExec)
        .mockReturnValueOnce(targetExec);

      const result = await service.validateSameCourse(mockSourceGroupId, mockTargetGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('One or both groups do not exist');
    });
  });

  describe('validateScheduleConflicts', () => {
    it('should return valid when no schedule conflicts exist', async () => {
      const enrollExec = {
        exec: jest.fn().mockResolvedValue([]),
      };
      (enrollmentModel.find as jest.Mock).mockReturnValue(enrollExec);

      const scheduleExec = {
        exec: jest.fn().mockResolvedValue([mockSchedule2]),
      };
      (groupScheduleModel.find as jest.Mock).mockReturnValue(scheduleExec);

      const result = await service.validateScheduleConflicts(
        mockStudentId,
        mockSourceGroupId,
        mockTargetGroupId,
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when schedule conflicts exist', async () => {
      const otherEnrollment = {
        _id: 'other-enrollment',
        studentId: mockStudentId,
        groupId: 'other-group-id',
        status: EnrollmentStatus.ENROLLED,
      };

      const enrollExec = {
        exec: jest.fn().mockResolvedValue([otherEnrollment]),
      };
      (enrollmentModel.find as jest.Mock).mockReturnValue(enrollExec);

      const conflictingSchedule = {
        ...mockSchedule2,
        startTime: '08:30', // Overlaps with mockSchedule1
        endTime: '10:30',
      };

      (groupScheduleModel.find as jest.Mock)
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue([mockSchedule1]) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue([conflictingSchedule]) });

      const result = await service.validateScheduleConflicts(
        mockStudentId,
        mockSourceGroupId,
        mockTargetGroupId,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Schedule conflict');
    });
  });

  describe('validateChangeRequest', () => {
    it('should return valid when all validations pass', async () => {
      // Mock validateActivePeriod
      const periodExec = {
        exec: jest.fn().mockResolvedValue(mockActivePeriod),
      };
      (academicPeriodModel.findOne as jest.Mock).mockReturnValue(periodExec);

      // Mock validateAvailableSpots
      const groupExec = {
        exec: jest.fn().mockResolvedValue(mockTargetGroup),
      };
      (courseGroupModel.findById as jest.Mock).mockReturnValue(groupExec);

      const countExec = {
        exec: jest.fn().mockResolvedValue(15),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countExec);

      // Mock validateScheduleConflicts
      const enrollExec = {
        exec: jest.fn().mockResolvedValue([]),
      };
      (enrollmentModel.find as jest.Mock).mockReturnValue(enrollExec);

      const scheduleExec = {
        exec: jest.fn().mockResolvedValue([mockSchedule2]),
      };
      (groupScheduleModel.find as jest.Mock).mockReturnValue(scheduleExec);

      // Mock validateStudentEnrollment
      (enrollmentModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEnrollment),
      });

      // Mock validateSameCourse
      (courseGroupModel.findById as jest.Mock)
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockSourceGroup) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockTargetGroup) });

      const result = await service.validateChangeRequest(
        mockStudentId,
        mockSourceGroupId,
        mockTargetGroupId,
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when any validation fails', async () => {
      // Mock validateActivePeriod to fail
      const periodExec = {
        exec: jest.fn().mockResolvedValue(null),
      };
      (academicPeriodModel.findOne as jest.Mock).mockReturnValue(periodExec);

      const result = await service.validateChangeRequest(
        mockStudentId,
        mockSourceGroupId,
        mockTargetGroupId,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle validation errors gracefully', async () => {
      (academicPeriodModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const result = await service.validateChangeRequest(
        mockStudentId,
        mockSourceGroupId,
        mockTargetGroupId,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Validation error');
    });
  });

  describe('detectScheduleConflicts', () => {
    it('should detect overlapping classes on same day', async () => {
      const schedule = [
        {
          dayOfWeek: 1,
          dayName: 'Lunes',
          classes: [
            {
              courseCode: 'MAT101',
              courseName: 'Matemáticas I',
              groupNumber: 'A',
              startTime: '08:00',
              endTime: '10:00',
              room: 'Aula 101',
            },
            {
              courseCode: 'FIS101',
              courseName: 'Física I',
              groupNumber: 'B',
              startTime: '09:00',
              endTime: '11:00',
              room: 'Aula 102',
            },
          ],
        },
      ];

      const conflicts = await service.detectScheduleConflicts(schedule);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].day).toBe('Lunes');
      expect(conflicts[0].conflictType).toBe('overlap');
      expect(conflicts[0].course1.code).toBe('MAT101');
      expect(conflicts[0].course2.code).toBe('FIS101');
    });

    it('should not detect conflicts for non-overlapping classes', async () => {
      const schedule = [
        {
          dayOfWeek: 1,
          dayName: 'Lunes',
          classes: [
            {
              courseCode: 'MAT101',
              courseName: 'Matemáticas I',
              groupNumber: 'A',
              startTime: '08:00',
              endTime: '10:00',
            },
            {
              courseCode: 'FIS101',
              courseName: 'Física I',
              groupNumber: 'B',
              startTime: '10:00',
              endTime: '12:00',
            },
          ],
        },
      ];

      const conflicts = await service.detectScheduleConflicts(schedule);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle empty schedule', async () => {
      const schedule = [
        {
          dayOfWeek: 1,
          dayName: 'Lunes',
          classes: [],
        },
      ];

      const conflicts = await service.detectScheduleConflicts(schedule);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle single class on day', async () => {
      const schedule = [
        {
          dayOfWeek: 1,
          dayName: 'Lunes',
          classes: [
            {
              courseCode: 'MAT101',
              courseName: 'Matemáticas I',
              groupNumber: 'A',
              startTime: '08:00',
              endTime: '10:00',
            },
          ],
        },
      ];

      const conflicts = await service.detectScheduleConflicts(schedule);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('validateClosedPeriod', () => {
    it('should return true when period is closed', async () => {
      const closedPeriod = {
        ...mockActivePeriod,
        status: 'CLOSED',
      };
      
      const execChain = {
        exec: jest.fn().mockResolvedValue(closedPeriod),
      };
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(execChain);

      const result = await service.validateClosedPeriod(mockPeriodId);

      expect(result).toBe(true);
    });

    it('should return false when period is not closed', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(mockActivePeriod),
      };
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(execChain);

      const result = await service.validateClosedPeriod(mockPeriodId);

      expect(result).toBe(false);
    });

    it('should return false when period not found', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue(null),
      };
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(execChain);

      const result = await service.validateClosedPeriod(mockPeriodId);

      expect(result).toBe(false);
    });
  });

  describe('getGroupSchedule', () => {
    it('should return formatted time slots for group', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue([mockSchedule1, mockSchedule2]),
      };
      (groupScheduleModel.find as jest.Mock).mockReturnValue(execChain);

      const result = await service.getGroupSchedule(mockSourceGroupId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('dayOfWeek');
      expect(result[0]).toHaveProperty('startTime');
      expect(result[0]).toHaveProperty('endTime');
      expect(result[0]).toHaveProperty('groupId');
      expect(result[0].groupId).toBe(mockSourceGroupId);
    });

    it('should return empty array when no schedules exist', async () => {
      const execChain = {
        exec: jest.fn().mockResolvedValue([]),
      };
      (groupScheduleModel.find as jest.Mock).mockReturnValue(execChain);

      const result = await service.getGroupSchedule(mockSourceGroupId);

      expect(result).toHaveLength(0);
    });
  });
});
