import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EnrollmentsService } from '../enrollments/services/enrollments.service';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import { Student, StudentDocument } from '../students/entities/student.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../course-groups/entities/course-group.entity';
import {
  GroupSchedule,
  GroupScheduleDocument,
} from '../group-schedules/entities/group-schedule.entity';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let enrollmentModel: Model<EnrollmentDocument>;
  let studentModel: Model<StudentDocument>;
  let courseGroupModel: Model<CourseGroupDocument>;
  let groupScheduleModel: Model<GroupScheduleDocument>;

  const mockStudentId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockGroupId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockEnrollmentId = '60d5ecb8b0a7c4b4b8b9b1a3';

  const mockStudent = {
    _id: mockStudentId,
    code: 'STU001',
    firstName: 'Juan',
    lastName: 'Pérez',
    externalId: 'student123',
  };

  const mockCourse = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a4',
    code: 'MAT101',
    name: 'Matemáticas I',
    credits: 3,
  };

  const mockGroup = {
    _id: mockGroupId,
    courseId: mockCourse,
    groupNumber: 'A',
    maxStudents: 30,
    currentEnrollments: 15,
  };

  const mockEnrollment = {
    _id: mockEnrollmentId,
    studentId: mockStudentId,
    groupId: mockGroupId,
    status: EnrollmentStatus.ENROLLED,
    enrolledAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  // Mock constructor function for enrollmentModel
  const mockEnrollmentModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: mockEnrollmentId,
    save: jest.fn().mockResolvedValue({
      _id: mockEnrollmentId,
      ...data,
    }),
  }));

  const mockEnrollmentModel = Object.assign(mockEnrollmentModelConstructor, {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  });

  const mockStudentModel = {
    findOne: jest.fn(),
  };

  const mockCourseGroupModel = {
    findById: jest.fn(),
  };

  const mockGroupScheduleModel = {
    findOne: jest.fn(),
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockPopulateChain = {
    exec: jest.fn(),
    populate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: getModelToken(Enrollment.name),
          useValue: mockEnrollmentModel,
        },
        {
          provide: getModelToken(Student.name),
          useValue: mockStudentModel,
        },
        {
          provide: getModelToken(CourseGroup.name),
          useValue: mockCourseGroupModel,
        },
        {
          provide: getModelToken(GroupSchedule.name),
          useValue: mockGroupScheduleModel,
        },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
    enrollmentModel = module.get<Model<EnrollmentDocument>>(
      getModelToken(Enrollment.name),
    );
    studentModel = module.get<Model<StudentDocument>>(
      getModelToken(Student.name),
    );
    courseGroupModel = module.get<Model<CourseGroupDocument>>(
      getModelToken(CourseGroup.name),
    );
    groupScheduleModel = module.get<Model<GroupScheduleDocument>>(
      getModelToken(GroupSchedule.name),
    );

    // Configure populate chain
    mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createEnrollmentDto = {
      studentId: 'STU001',
      groupId: mockGroupId,
      status: EnrollmentStatus.ENROLLED,
    };

    it('should create an enrollment successfully', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      const newEnrollment = {
        ...mockEnrollment,
        save: jest.fn().mockResolvedValue(mockEnrollment),
      };
      mockEnrollmentModel.create = jest.fn().mockImplementation(() => newEnrollment);

      const result = await service.create(createEnrollmentDto);

      expect(mockStudentModel.findOne).toHaveBeenCalledWith({ code: 'STU001' });
      expect(mockCourseGroupModel.findById).toHaveBeenCalledWith(mockGroupId);
      expect(mockEnrollmentModel.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when student does not exist', async () => {
      mockStudentModel.findOne.mockResolvedValue(null);

      await expect(service.create(createEnrollmentDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createEnrollmentDto)).rejects.toThrow(
        'Student with ID STU001 not found',
      );
    });

    it('should throw NotFoundException when course group does not exist', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      const populateChain = {
        populate: jest.fn().mockResolvedValue(null),
      };
      mockCourseGroupModel.findById.mockReturnValue(populateChain);

      await expect(service.create(createEnrollmentDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createEnrollmentDto)).rejects.toThrow(
        `Course group with ID ${mockGroupId} not found`,
      );
    });

    it('should throw BadRequestException when student is already enrolled', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockResolvedValue(mockEnrollment);

      await expect(service.create(createEnrollmentDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createEnrollmentDto)).rejects.toThrow(
        'Student is already enrolled in this course group',
      );
    });

    it('should not allow duplicate enrollment with PASSED status', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.PASSED,
      });

      await expect(service.create(createEnrollmentDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set default status to ENROLLED when not provided', async () => {
      const dtoWithoutStatus = {
        studentId: 'STU001',
        groupId: mockGroupId,
      };

      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      await service.create(dtoWithoutStatus);

      expect(mockEnrollmentModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EnrollmentStatus.ENROLLED,
        }),
      );
    });

    it('should include enrolledAt timestamp', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      await service.create(createEnrollmentDto);

      expect(mockEnrollmentModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          enrolledAt: expect.any(Date),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all enrollments with populated data', async () => {
      const enrollments = [mockEnrollment];
      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockEnrollmentModel.find.mockReturnValue(mockPopulateChain);

      const result = await service.findAll();

      expect(mockEnrollmentModel.find).toHaveBeenCalled();
      expect(mockPopulateChain.populate).toHaveBeenCalledWith('studentId');
      expect(result).toEqual(enrollments);
    });

    it('should return empty array when no enrollments exist', async () => {
      mockPopulateChain.exec.mockResolvedValue([]);
      mockEnrollmentModel.find.mockReturnValue(mockPopulateChain);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an enrollment by id', async () => {
      mockPopulateChain.exec.mockResolvedValue(mockEnrollment);
      mockEnrollmentModel.findById.mockReturnValue(mockPopulateChain);

      const result = await service.findOne(mockEnrollmentId);

      expect(mockEnrollmentModel.findById).toHaveBeenCalledWith(mockEnrollmentId);
      expect(result).toEqual(mockEnrollment);
    });

    it('should throw NotFoundException when enrollment not found', async () => {
      mockPopulateChain.exec.mockResolvedValue(null);
      mockEnrollmentModel.findById.mockReturnValue(mockPopulateChain);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Enrollment with ID nonexistent not found',
      );
    });
  });

  describe('findByStudent', () => {
    it('should return all enrollments for a student', async () => {
      const enrollments = [mockEnrollment];
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockEnrollmentModel.find.mockReturnValue(mockPopulateChain);

      const result = await service.findByStudent('STU001');

      expect(mockStudentModel.findOne).toHaveBeenCalledWith({ code: 'STU001' });
      expect(mockEnrollmentModel.find).toHaveBeenCalledWith({
        studentId: mockStudentId,
      });
      expect(result).toEqual(enrollments);
    });

    it('should throw NotFoundException when student not found', async () => {
      mockStudentModel.findOne.mockResolvedValue(null);

      await expect(service.findByStudent('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByStudent('nonexistent')).rejects.toThrow(
        'Student with code nonexistent not found',
      );
    });

    it('should return empty array when student has no enrollments', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue([]);
      mockEnrollmentModel.find.mockReturnValue(mockPopulateChain);

      const result = await service.findByStudent('STU001');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateDto = {
      status: EnrollmentStatus.PASSED,
      grade: 4.5,
    };

    it('should update an enrollment successfully', async () => {
      const updatedEnrollment = { ...mockEnrollment, ...updateDto };
      mockEnrollmentModel.findByIdAndUpdate.mockResolvedValue(updatedEnrollment);

      const result = await service.update(mockEnrollmentId, updateDto);

      expect(mockEnrollmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEnrollmentId,
        updateDto,
        { new: true },
      );
      expect(result.status).toBe(EnrollmentStatus.PASSED);
      expect(result.grade).toBe(4.5);
    });

    it('should throw NotFoundException when enrollment not found', async () => {
      mockEnrollmentModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow updating only grade', async () => {
      const gradeUpdateDto = { grade: 3.5 };
      const updatedEnrollment = { ...mockEnrollment, grade: 3.5 };
      mockEnrollmentModel.findByIdAndUpdate.mockResolvedValue(updatedEnrollment);

      const result = await service.update(mockEnrollmentId, gradeUpdateDto);

      expect(result.grade).toBe(3.5);
    });

    it('should allow updating only status', async () => {
      const statusUpdateDto = { status: EnrollmentStatus.FAILED };
      const updatedEnrollment = {
        ...mockEnrollment,
        status: EnrollmentStatus.FAILED,
      };
      mockEnrollmentModel.findByIdAndUpdate.mockResolvedValue(updatedEnrollment);

      const result = await service.update(mockEnrollmentId, statusUpdateDto);

      expect(result.status).toBe(EnrollmentStatus.FAILED);
    });
  });

  describe('remove', () => {
    it('should remove an enrollment successfully', async () => {
      mockEnrollmentModel.findByIdAndDelete.mockResolvedValue(mockEnrollment);

      await service.remove(mockEnrollmentId);

      expect(mockEnrollmentModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockEnrollmentId,
      );
    });

    it('should throw NotFoundException when enrollment not found', async () => {
      mockEnrollmentModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('nonexistent')).rejects.toThrow(
        'Enrollment with ID nonexistent not found',
      );
    });
  });

  describe('enrollStudentInCourse', () => {
    it('should enroll student using helper method', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      const result = await service.enrollStudentInCourse('STU001', mockGroupId);

      expect(result).toBeDefined();
      expect(mockEnrollmentModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EnrollmentStatus.ENROLLED,
        }),
      );
    });

    it('should throw error if student already enrolled', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockResolvedValue(mockEnrollment);

      await expect(
        service.enrollStudentInCourse('STU001', mockGroupId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle concurrent enrollment attempts', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      const enrollmentPromises = [
        service.create({ studentId: 'STU001', groupId: mockGroupId }),
        service.create({ studentId: 'STU001', groupId: mockGroupId }),
      ];

      // Both should attempt to create
      await Promise.all(enrollmentPromises.map((p) => p.catch((e) => e)));

      expect(mockEnrollmentModelConstructor).toHaveBeenCalled();
    });

    it('should properly populate course data in group', async () => {
      const enrollments = [
        {
          ...mockEnrollment,
          groupId: mockGroup,
        },
      ];
      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockEnrollmentModel.find.mockReturnValue(mockPopulateChain);

      await service.findAll();

      expect(mockPopulateChain.populate).toHaveBeenCalledWith('studentId');
      expect(mockPopulateChain.populate).toHaveBeenCalledWith({
        path: 'groupId',
        populate: { path: 'courseId' },
      });
    });

    it('should handle enrollment with null grade', async () => {
      const enrollmentWithNullGrade = { ...mockEnrollment, grade: null };
      mockEnrollmentModel.findByIdAndUpdate.mockResolvedValue(
        enrollmentWithNullGrade,
      );

      const result = await service.update(mockEnrollmentId, { grade: undefined });

      expect(result.grade).toBeNull();
    });

    it('should check for ENROLLED and PASSED status in duplicate check', async () => {
      mockStudentModel.findOne.mockResolvedValue(mockStudent);
      mockPopulateChain.exec.mockResolvedValue(mockGroup);
      mockCourseGroupModel.findById.mockReturnValue(mockPopulateChain);
      mockEnrollmentModel.findOne.mockImplementation((query) => {
        // Verify the status query includes both ENROLLED and PASSED
        expect(query.status.$in).toContain(EnrollmentStatus.ENROLLED);
        expect(query.status.$in).toContain(EnrollmentStatus.PASSED);
        return Promise.resolve(null);
      });

      const newEnrollment = {
        ...mockEnrollment,
        save: jest.fn().mockResolvedValue(mockEnrollment),
      };
      mockEnrollmentModel.create = jest.fn().mockImplementation(() => newEnrollment);

      await service.create({ studentId: 'STU001', groupId: mockGroupId });

      expect(mockEnrollmentModel.findOne).toHaveBeenCalled();
    });
  });
});
