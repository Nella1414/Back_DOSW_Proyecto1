import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CourseGroupsService } from '../course-groups/services/course-groups.service';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../course-groups/entities/course-group.entity';
import { Course, CourseDocument } from '../courses/entities/course.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../academic-periods/entities/academic-period.entity';
import {
  GroupSchedule,
  GroupScheduleDocument,
} from '../group-schedules/entities/group-schedule.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';

describe('CourseGroupsService', () => {
  let service: CourseGroupsService;
  let courseGroupModel: Model<CourseGroupDocument>;
  let courseModel: Model<CourseDocument>;
  let academicPeriodModel: Model<AcademicPeriodDocument>;
  let groupScheduleModel: Model<GroupScheduleDocument>;
  let enrollmentModel: Model<EnrollmentDocument>;

  const mockGroupId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockCourseId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockPeriodId = '60d5ecb8b0a7c4b4b8b9b1a3';

  const mockCourse = {
    _id: mockCourseId,
    code: 'MAT101',
    name: 'Matemáticas I',
    credits: 3,
  };

  const mockPeriod = {
    _id: mockPeriodId,
    code: '2024-2',
    name: 'Segundo Semestre 2024',
  };

  const mockGroup = {
    _id: mockGroupId,
    courseId: mockCourseId,
    periodId: mockPeriodId,
    groupNumber: 'A',
    maxStudents: 30,
    currentEnrollments: 15,
    isActive: true,
  };

  const mockSchedule = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a4',
    groupId: mockGroupId,
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '10:00',
    room: 'Aula 101',
  };

  const mockExecChain = {
    exec: jest.fn(),
    populate: jest.fn(),
  };
  const mockPopulateChain = {
    exec: jest.fn(),
    populate: jest.fn(),
  };

  // Mock constructor function for courseGroupModel
  const mockCourseGroupModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: mockGroupId,
    save: jest.fn().mockResolvedValue({
      _id: mockGroupId,
      ...data,
      currentEnrollments: 0,
    }),
  }));

  const mockCourseGroupModelValue = Object.assign(mockCourseGroupModelConstructor, {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateOne: jest.fn(),
    create: jest.fn(),
  });

  beforeEach(async () => {
    const mockCourseModelValue = {
      findById: jest.fn(),
    };

    const mockAcademicPeriodModelValue = {
      findById: jest.fn(),
    };

    const mockGroupScheduleModelValue = {
      find: jest.fn(),
      deleteMany: jest.fn(),
    };

    const mockEnrollmentModelValue = {
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseGroupsService,
        {
          provide: getModelToken(CourseGroup.name),
          useValue: mockCourseGroupModelValue,
        },
        {
          provide: getModelToken(Course.name),
          useValue: mockCourseModelValue,
        },
        {
          provide: getModelToken(AcademicPeriod.name),
          useValue: mockAcademicPeriodModelValue,
        },
        {
          provide: getModelToken(GroupSchedule.name),
          useValue: mockGroupScheduleModelValue,
        },
        {
          provide: getModelToken(Enrollment.name),
          useValue: mockEnrollmentModelValue,
        },
      ],
    }).compile();

    service = module.get<CourseGroupsService>(CourseGroupsService);
    courseGroupModel = module.get<Model<CourseGroupDocument>>(
      getModelToken(CourseGroup.name),
    );
    courseModel = module.get<Model<CourseDocument>>(getModelToken(Course.name));
    academicPeriodModel = module.get<Model<AcademicPeriodDocument>>(
      getModelToken(AcademicPeriod.name),
    );
    groupScheduleModel = module.get<Model<GroupScheduleDocument>>(
      getModelToken(GroupSchedule.name),
    );
    enrollmentModel = module.get<Model<EnrollmentDocument>>(
      getModelToken(Enrollment.name),
    );

    mockExecChain.populate.mockReturnValue(mockExecChain);
    mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      courseId: mockCourseId,
      periodId: mockPeriodId,
      groupNumber: 'A',
      maxStudents: 30,
    };

    it('should create a course group successfully', async () => {
      mockExecChain.exec.mockResolvedValueOnce(mockCourse);
      (courseModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(mockPeriod);
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(null);
      (courseGroupModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const newGroup = {
        ...mockGroup,
        save: jest.fn().mockResolvedValue(mockGroup),
      };
      (courseGroupModel.create as jest.Mock) = jest
        .fn()
        .mockImplementation(() => newGroup);

      const result = await service.create(createDto);

      expect(courseModel.findById).toHaveBeenCalledWith(mockCourseId);
      expect(academicPeriodModel.findById).toHaveBeenCalledWith(mockPeriodId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when course not found', async () => {
      mockExecChain.exec.mockResolvedValue(null);
      (courseModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Course not found');
    });

    it('should throw NotFoundException when period not found', async () => {
      const courseChain = {
        exec: jest.fn().mockResolvedValue(mockCourse),
      };
      const periodChain = {
        exec: jest.fn().mockResolvedValue(null),
      };
      (courseModel.findById as jest.Mock).mockReturnValue(courseChain);
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(periodChain);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Academic period not found',
      );
    });

    it('should throw BadRequestException when group already exists', async () => {
      const courseChain = {
        exec: jest.fn().mockResolvedValue(mockCourse),
      };
      const periodChain = {
        exec: jest.fn().mockResolvedValue(mockPeriod),
      };
      const groupChain = {
        exec: jest.fn().mockResolvedValue(mockGroup),
      };
      (courseModel.findById as jest.Mock).mockReturnValue(courseChain);
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(periodChain);
      (courseGroupModel.findOne as jest.Mock).mockReturnValue(groupChain);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        /Group A already exists/,
      );
    });

    it('should initialize currentEnrollments to 0', async () => {
      const courseChain = {
        exec: jest.fn().mockResolvedValue(mockCourse),
      };
      const periodChain = {
        exec: jest.fn().mockResolvedValue(mockPeriod),
      };
      const groupChain = {
        exec: jest.fn().mockResolvedValue(null),
      };
      (courseModel.findById as jest.Mock).mockReturnValue(courseChain);
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(periodChain);
      (courseGroupModel.findOne as jest.Mock).mockReturnValue(groupChain);

      await service.create(createDto);

      expect(mockCourseGroupModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ currentEnrollments: 0 }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all course groups with populated data', async () => {
      const groups = [mockGroup];
      mockPopulateChain.exec.mockResolvedValue(groups);
      (courseGroupModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      const result = await service.findAll();

      expect(courseGroupModel.find).toHaveBeenCalled();
      expect(mockPopulateChain.populate).toHaveBeenCalledWith('courseId');
      expect(mockPopulateChain.populate).toHaveBeenCalledWith('periodId');
      expect(mockPopulateChain.populate).toHaveBeenCalledWith('professorId');
      expect(result).toEqual(groups);
    });
  });

  describe('findByPeriod', () => {
    it('should return active groups for a period', async () => {
      const groups = [mockGroup];
      mockPopulateChain.exec.mockResolvedValue(groups);
      (courseGroupModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      const result = await service.findByPeriod(mockPeriodId);

      expect(courseGroupModel.find).toHaveBeenCalledWith({
        periodId: mockPeriodId,
        isActive: true,
      });
      expect(result).toEqual(groups);
    });
  });

  describe('findByCourse', () => {
    it('should return groups for a course', async () => {
      const groups = [mockGroup];
      mockPopulateChain.exec.mockResolvedValue(groups);
      (courseGroupModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      const result = await service.findByCourse(mockCourseId);

      expect(courseGroupModel.find).toHaveBeenCalledWith({
        courseId: mockCourseId,
        isActive: true,
      });
      expect(result).toEqual(groups);
    });

    it('should filter by period when provided', async () => {
      const groups = [mockGroup];
      mockPopulateChain.exec.mockResolvedValue(groups);
      (courseGroupModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      await service.findByCourse(mockCourseId, mockPeriodId);

      expect(courseGroupModel.find).toHaveBeenCalledWith({
        courseId: mockCourseId,
        periodId: mockPeriodId,
        isActive: true,
      });
    });
  });

  describe('getAvailableGroups', () => {
    it('should return groups with available spots', async () => {
      const groupWithSpots = {
        ...mockGroup,
        _id: mockGroupId,
        courseId: mockCourse,
      };
      const findChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([groupWithSpots]),
      };
      (courseGroupModel.find as jest.Mock).mockReturnValue(findChain);

      const countChain = {
        exec: jest.fn().mockResolvedValue(15),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const scheduleChain = {
        exec: jest.fn().mockResolvedValue([mockSchedule]),
      };
      (groupScheduleModel.find as jest.Mock).mockReturnValue(scheduleChain);

      const updateChain = {
        exec: jest.fn().mockResolvedValue({}),
      };
      (courseGroupModel.updateOne as jest.Mock).mockReturnValue(updateChain);

      const result = await service.getAvailableGroups();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('availableSpots');
      expect(result[0].availableSpots).toBeGreaterThanOrEqual(0);
    });

    it('should exclude full groups', async () => {
      const fullGroup = {
        ...mockGroup,
        _id: mockGroupId,
        maxStudents: 30,
        currentEnrollments: 30,
        courseId: mockCourse,
      };
      const findChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([fullGroup]),
      };
      (courseGroupModel.find as jest.Mock).mockReturnValue(findChain);

      const countChain = {
        exec: jest.fn().mockResolvedValue(30),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const updateChain = {
        exec: jest.fn().mockResolvedValue({}),
      };
      (courseGroupModel.updateOne as jest.Mock).mockReturnValue(updateChain);

      const result = await service.getAvailableGroups();

      expect(result).toEqual([]);
    });

    it('should update enrollment count if different', async () => {
      const groupWithWrongCount = {
        ...mockGroup,
        _id: mockGroupId,
        courseId: mockCourse,
        currentEnrollments: 10,
      };
      const findChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([groupWithWrongCount]),
      };
      (courseGroupModel.find as jest.Mock).mockReturnValue(findChain);

      const countChain = {
        exec: jest.fn().mockResolvedValue(15),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const scheduleChain = {
        exec: jest.fn().mockResolvedValue([mockSchedule]),
      };
      (groupScheduleModel.find as jest.Mock).mockReturnValue(scheduleChain);

      const updateChain = {
        exec: jest.fn().mockResolvedValue({}),
      };
      (courseGroupModel.updateOne as jest.Mock).mockReturnValue(updateChain);

      await service.getAvailableGroups();

      expect(courseGroupModel.updateOne).toHaveBeenCalledWith(
        { _id: mockGroupId },
        { currentEnrollments: 15 },
      );
    });

    it('should include schedule information', async () => {
      const groupWithSpots = {
        ...mockGroup,
        _id: mockGroupId,
        courseId: mockCourse,
      };
      const findChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([groupWithSpots]),
      };
      (courseGroupModel.find as jest.Mock).mockReturnValue(findChain);

      const countChain = {
        exec: jest.fn().mockResolvedValue(15),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const scheduleChain = {
        exec: jest.fn().mockResolvedValue([mockSchedule]),
      };
      (groupScheduleModel.find as jest.Mock).mockReturnValue(scheduleChain);

      const updateChain = {
        exec: jest.fn().mockResolvedValue({}),
      };
      (courseGroupModel.updateOne as jest.Mock).mockReturnValue(updateChain);

      const result = await service.getAvailableGroups();

      expect(result[0].schedule).toBeDefined();
      expect(result[0].schedule.length).toBeGreaterThan(0);
      expect(result[0].schedule[0]).toHaveProperty('dayOfWeek');
      expect(result[0].schedule[0]).toHaveProperty('startTime');
      expect(result[0].schedule[0]).toHaveProperty('endTime');
    });

    it('should sort schedules by dayOfWeek', async () => {
      const groupWithSpots = {
        ...mockGroup,
        _id: mockGroupId,
        courseId: mockCourse,
      };
      const findChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([groupWithSpots]),
      };
      (courseGroupModel.find as jest.Mock).mockReturnValue(findChain);

      const countChain = {
        exec: jest.fn().mockResolvedValue(15),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const schedules = [
        { ...mockSchedule, dayOfWeek: 3 },
        { ...mockSchedule, dayOfWeek: 1 },
        { ...mockSchedule, dayOfWeek: 2 },
      ];
      const scheduleChain = {
        exec: jest.fn().mockResolvedValue(schedules),
      };
      (groupScheduleModel.find as jest.Mock).mockReturnValue(scheduleChain);

      const updateChain = {
        exec: jest.fn().mockResolvedValue({}),
      };
      (courseGroupModel.updateOne as jest.Mock).mockReturnValue(updateChain);

      const result = await service.getAvailableGroups();

      expect(result[0].schedule[0].dayOfWeek).toBe(1);
      expect(result[0].schedule[1].dayOfWeek).toBe(2);
      expect(result[0].schedule[2].dayOfWeek).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a group by id', async () => {
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      (courseGroupModel.findById as jest.Mock).mockReturnValue(mockPopulateChain);

      const result = await service.findOne(mockGroupId);

      expect(courseGroupModel.findById).toHaveBeenCalledWith(mockGroupId);
      expect(result).toEqual(mockGroup);
    });

    it('should throw NotFoundException when group not found', async () => {
      mockPopulateChain.exec.mockResolvedValue(null);
      (courseGroupModel.findById as jest.Mock).mockReturnValue(mockPopulateChain);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Course group not found',
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      maxStudents: 35,
      isActive: false,
    };

    it('should update a group successfully', async () => {
      mockExecChain.exec.mockResolvedValue(mockGroup);
      (courseGroupModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      const updatedGroup = {
        ...mockGroup,
        ...updateDto,
        save: jest.fn().mockResolvedValue({ ...mockGroup, ...updateDto }),
      };
      (courseGroupModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedGroup),
      });

      Object.assign(updatedGroup, updateDto);

      const result = await service.update(mockGroupId, updateDto);

      expect(result.maxStudents).toBe(35);
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when group not found', async () => {
      mockExecChain.exec.mockResolvedValue(null);
      (courseGroupModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate group number uniqueness when updating', async () => {
      const existingGroup = { ...mockGroup };
      const anotherGroup = { ...mockGroup, _id: 'different-id' };

      mockExecChain.exec.mockResolvedValueOnce(existingGroup);
      (courseGroupModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(anotherGroup);
      (courseGroupModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      await expect(
        service.update(mockGroupId, { groupNumber: 'B' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a group with no enrollments', async () => {
      mockExecChain.exec.mockResolvedValue(mockGroup);
      (courseGroupModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValue(0);
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValue({});
      (groupScheduleModel.deleteMany as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValue({});
      (courseGroupModel.findByIdAndDelete as jest.Mock).mockReturnValue(
        mockExecChain,
      );

      await service.remove(mockGroupId);

      expect(groupScheduleModel.deleteMany).toHaveBeenCalledWith({
        groupId: mockGroupId,
      });
      expect(courseGroupModel.findByIdAndDelete).toHaveBeenCalledWith(mockGroupId);
    });

    it('should throw BadRequestException when group has enrollments', async () => {
      mockExecChain.exec.mockResolvedValue(mockGroup);
      (courseGroupModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValue(5);
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(mockExecChain);

      await expect(service.remove(mockGroupId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove(mockGroupId)).rejects.toThrow(
        /Cannot delete a group that has enrolled students/,
      );
    });

    it('should throw NotFoundException when group not found', async () => {
      mockExecChain.exec.mockResolvedValue(null);
      (courseGroupModel.findById as jest.Mock).mockReturnValue(mockExecChain);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEnrollmentCount', () => {
    it('should update enrollment count', async () => {
      const countChain = {
        exec: jest.fn().mockResolvedValue(20),
      };
      (enrollmentModel.countDocuments as jest.Mock).mockReturnValue(countChain);

      const updateChain = {
        exec: jest.fn().mockResolvedValue({}),
      };
      (courseGroupModel.updateOne as jest.Mock).mockReturnValue(updateChain);

      await service.updateEnrollmentCount(mockGroupId);

      expect(enrollmentModel.countDocuments).toHaveBeenCalledWith({
        groupId: mockGroupId,
        status: EnrollmentStatus.ENROLLED,
      });
      expect(courseGroupModel.updateOne).toHaveBeenCalledWith(
        { _id: mockGroupId },
        { currentEnrollments: 20 },
      );
    });
  });

  describe('getGroupsByStudent', () => {
    const mockStudentId = 'student123';

    it('should return groups for a student', async () => {
      const enrollments = [
        { studentId: mockStudentId, groupId: mockGroupId },
      ];
      mockExecChain.exec.mockResolvedValue(enrollments);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockExecChain);

      mockPopulateChain.exec.mockResolvedValue([mockGroup]);
      (courseGroupModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      const result = await service.getGroupsByStudent(mockStudentId);

      expect(enrollmentModel.find).toHaveBeenCalledWith({
        studentId: mockStudentId,
        status: EnrollmentStatus.ENROLLED,
      });
      expect(result).toBeDefined();
    });

    it('should filter by period when provided', async () => {
      const enrollments = [
        { studentId: mockStudentId, groupId: mockGroupId },
      ];
      mockExecChain.exec.mockResolvedValue(enrollments);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockExecChain);

      mockPopulateChain.exec.mockResolvedValue([mockGroup]);
      (courseGroupModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      await service.getGroupsByStudent(mockStudentId, mockPeriodId);

      expect(courseGroupModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          periodId: mockPeriodId,
        }),
      );
    });
  });
});
