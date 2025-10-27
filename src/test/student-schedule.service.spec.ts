import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StudentScheduleService } from '../schedules/services/student-schedule.service';
import { Student, StudentDocument } from '../students/entities/student.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import { CourseGroup } from '../course-groups/entities/course-group.entity';
import { Course } from '../courses/entities/course.entity';
import {
  GroupSchedule,
  GroupScheduleDocument,
} from '../group-schedules/entities/group-schedule.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../academic-periods/entities/academic-period.entity';
import { AcademicTrafficLightService } from '../academic-traffic-light/services/academic-traffic-light.service';

describe('StudentScheduleService', () => {
  let service: StudentScheduleService;
  let studentModel: Model<StudentDocument>;
  let enrollmentModel: Model<EnrollmentDocument>;
  let groupScheduleModel: Model<GroupScheduleDocument>;
  let academicPeriodModel: Model<AcademicPeriodDocument>;
  let academicTrafficLightService: jest.Mocked<AcademicTrafficLightService>;

  const mockStudentId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockCourseId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockGroupId = '60d5ecb8b0a7c4b4b8b9b1a3';
  const mockPeriodId = '60d5ecb8b0a7c4b4b8b9b1a4';
  const mockEnrollmentId = '60d5ecb8b0a7c4b4b8b9b1a5';

  const mockStudent = {
    _id: mockStudentId,
    code: 'STU001',
    externalId: 'student123',
    firstName: 'Juan',
    lastName: 'Pérez',
    currentSemester: 5,
  };

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
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-12-15'),
    isActive: true,
    status: 'ACTIVE',
  };

  const mockGroup = {
    _id: mockGroupId,
    groupNumber: 'A',
    courseId: mockCourse,
    periodId: mockPeriod,
  };

  const mockEnrollment = {
    _id: mockEnrollmentId,
    studentId: mockStudentId,
    groupId: mockGroup,
    status: EnrollmentStatus.ENROLLED,
    grade: null,
  };

  const mockGroupSchedule = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a6',
    groupId: mockGroupId,
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '10:00',
    room: 'Aula 101',
  };

  const mockExecChain = {
    exec: jest.fn(),
  };

  const mockPopulateChain = {
    exec: jest.fn(),
    populate: jest.fn(),
  };

  const mockSortChain = {
    exec: jest.fn(),
    sort: jest.fn(),
  };

  beforeEach(async () => {
    const mockStudentModel = {
      findOne: jest.fn(),
    };

    const mockEnrollmentModel = {
      find: jest.fn(),
    };

    const mockCourseGroupModel = {
      findById: jest.fn(),
    };

    const mockCourseModel = {
      findById: jest.fn(),
    };

    const mockGroupScheduleModel = {
      find: jest.fn(),
    };

    const mockAcademicPeriodModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    const mockAcademicTrafficLightService = {
      getTrafficLightColor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentScheduleService,
        {
          provide: getModelToken(Student.name),
          useValue: mockStudentModel,
        },
        {
          provide: getModelToken(Enrollment.name),
          useValue: mockEnrollmentModel,
        },
        {
          provide: getModelToken(CourseGroup.name),
          useValue: mockCourseGroupModel,
        },
        {
          provide: getModelToken(Course.name),
          useValue: mockCourseModel,
        },
        {
          provide: getModelToken(GroupSchedule.name),
          useValue: mockGroupScheduleModel,
        },
        {
          provide: getModelToken(AcademicPeriod.name),
          useValue: mockAcademicPeriodModel,
        },
        {
          provide: AcademicTrafficLightService,
          useValue: mockAcademicTrafficLightService,
        },
      ],
    }).compile();

    service = module.get<StudentScheduleService>(StudentScheduleService);
    studentModel = module.get<Model<StudentDocument>>(
      getModelToken(Student.name),
    );
    enrollmentModel = module.get<Model<EnrollmentDocument>>(
      getModelToken(Enrollment.name),
    );
    groupScheduleModel = module.get<Model<GroupScheduleDocument>>(
      getModelToken(GroupSchedule.name),
    );
    academicPeriodModel = module.get<Model<AcademicPeriodDocument>>(
      getModelToken(AcademicPeriod.name),
    );
    academicTrafficLightService = module.get(AcademicTrafficLightService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentSchedule', () => {
    it('should return current schedule for a student', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(mockPeriod);
      (academicPeriodModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockPopulateChain.exec.mockResolvedValue([mockEnrollment]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      mockExecChain.exec.mockResolvedValue([mockGroupSchedule]);
      (groupScheduleModel.find as jest.Mock).mockReturnValue(mockExecChain);

      // Act
      const result = await service.getCurrentSchedule('student123');

      // Assert
      expect(studentModel.findOne).toHaveBeenCalledWith({
        externalId: 'student123',
      });
      expect(academicPeriodModel.findOne).toHaveBeenCalledWith({
        isActive: true,
      }) as unknown as void;
      expect(result).toBeDefined();
      expect(result.studentId).toBe('STU001');
      expect(result.studentName).toBe('Juan Pérez');
      expect(result.currentSemester).toBe(5);
      expect(result.period).toBe('2024-2');
    });

    it('should throw error when student not found', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValue(null);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      // Act & Assert
      await expect(service.getCurrentSchedule('nonexistent')).rejects.toThrow(
        'Student not found',
      );
    });

    it('should throw error when no active period exists', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(null);
      (academicPeriodModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      // Act & Assert
      await expect(service.getCurrentSchedule('student123')).rejects.toThrow(
        'No active academic period found',
      );
    });

    it('should return empty schedule when student has no enrollments', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(mockPeriod);
      (academicPeriodModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockPopulateChain.exec.mockResolvedValue([]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getCurrentSchedule('student123');

      // Assert
      expect(result.schedule).toEqual([]);
      expect(result.studentId).toBe('STU001');
    });
  });

  describe('getHistoricalSchedules', () => {
    it('should return historical schedules for a student', async () => {
      // Arrange
      const closedPeriod = { ...mockPeriod, status: 'CLOSED' };

      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockSortChain.exec.mockResolvedValue([closedPeriod]);
      mockSortChain.sort.mockReturnValue(mockSortChain);
      (academicPeriodModel.find as jest.Mock).mockReturnValue(mockSortChain);

      const passedEnrollment = {
        ...mockEnrollment,
        status: EnrollmentStatus.PASSED,
        grade: 4.5,
      };

      mockPopulateChain.exec.mockResolvedValue([passedEnrollment]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getHistoricalSchedules('student123');

      // Assert
      expect(result).toBeDefined();
      expect(result.studentId).toBe('STU001');
      expect(result.periods).toBeDefined();
    });

    it('should throw NotFoundException when student not found', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValue(null);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      // Act & Assert
      await expect(
        service.getHistoricalSchedules('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter by date range when provided', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockSortChain.exec.mockResolvedValue([]);
      mockSortChain.sort.mockReturnValue(mockSortChain);
      (academicPeriodModel.find as jest.Mock).mockReturnValue(mockSortChain);

      // Act
      const result = await service.getHistoricalSchedules(
        'student123',
        '2024-01-01',
        '2024-12-31',
      );

      // Assert
      expect(academicPeriodModel.find).toHaveBeenCalled();
      expect(result.periods).toEqual([]);
    });

    it('should return empty periods when no historical data exists', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockSortChain.exec.mockResolvedValue([]);
      mockSortChain.sort.mockReturnValue(mockSortChain);
      (academicPeriodModel.find as jest.Mock).mockReturnValue(mockSortChain);

      // Act
      const result = await service.getHistoricalSchedules('student123');

      // Assert
      expect(result.periods).toEqual([]);
      expect(result.studentId).toBe('STU001');
    });
  });

  describe('getHistoricalScheduleByPeriod', () => {
    it('should return schedule for a closed period', async () => {
      // Arrange
      const closedPeriod = { ...mockPeriod, status: 'CLOSED' };

      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(closedPeriod);
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(
        mockExecChain,
      );

      const passedEnrollment = {
        ...mockEnrollment,
        status: EnrollmentStatus.PASSED,
        grade: 4.5,
      };

      mockPopulateChain.exec.mockResolvedValue([passedEnrollment]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      mockExecChain.exec.mockResolvedValue([mockGroupSchedule]);
      (groupScheduleModel.find as jest.Mock).mockReturnValue(mockExecChain);

      // Act
      const result = await service.getHistoricalScheduleByPeriod(
        'student123',
        mockPeriodId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.studentId).toBe('STU001');
      expect(result.period.code).toBe('2024-2');
    });

    it('should throw NotFoundException when student not found', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValue(null);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      // Act & Assert
      await expect(
        service.getHistoricalScheduleByPeriod('nonexistent', mockPeriodId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when period not found', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(null);
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(
        mockExecChain,
      );

      // Act & Assert
      await expect(
        service.getHistoricalScheduleByPeriod(
          'student123',
          'nonexistent-period',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when period is not closed', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(mockPeriod); // Active period
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(
        mockExecChain,
      );

      // Act & Assert
      await expect(
        service.getHistoricalScheduleByPeriod('student123', mockPeriodId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return empty schedule when no enrollments for period', async () => {
      // Arrange
      const closedPeriod = { ...mockPeriod, status: 'CLOSED' };

      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockExecChain.exec.mockResolvedValueOnce(closedPeriod);
      (academicPeriodModel.findById as jest.Mock).mockReturnValue(
        mockExecChain,
      );

      mockPopulateChain.exec.mockResolvedValue([]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getHistoricalScheduleByPeriod(
        'student123',
        mockPeriodId,
      );

      // Assert
      expect(result.schedule).toEqual([]);
      expect(result.courses).toEqual([]);
    });
  });

  describe('getStudentAcademicHistory', () => {
    it('should return complete academic history', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        { ...mockEnrollment, status: EnrollmentStatus.PASSED, grade: 4.5 },
        { ...mockEnrollment, status: EnrollmentStatus.ENROLLED, grade: null },
        { ...mockEnrollment, status: EnrollmentStatus.FAILED, grade: 2.0 },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      academicTrafficLightService.getTrafficLightColor.mockReturnValueOnce(
        'green',
      );
      academicTrafficLightService.getTrafficLightColor.mockReturnValueOnce(
        'blue',
      );
      academicTrafficLightService.getTrafficLightColor.mockReturnValueOnce(
        'red',
      );

      // Act
      const result = await service.getStudentAcademicHistory('student123');

      // Assert
      expect(result).toBeDefined();
      expect(result.studentId).toBe('STU001');
      expect(result.academicHistory.passedCourses).toBeDefined();
      expect(result.academicHistory.currentCourses).toBeDefined();
      expect(result.academicHistory.failedCourses).toBeDefined();
    });

    it('should throw error when student not found', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValue(null);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      // Act & Assert
      await expect(
        service.getStudentAcademicHistory('nonexistent'),
      ).rejects.toThrow('Student not found');
    });
  });
});
