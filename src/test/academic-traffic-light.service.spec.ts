import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { AcademicTrafficLightService } from '../academic-traffic-light/services/academic-traffic-light.service';
import { Student, StudentDocument } from '../students/entities/student.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import {
  CourseGroup,
  CourseGroupDocument,
} from '../course-groups/entities/course-group.entity';
import { Course, CourseDocument } from '../courses/entities/course.entity';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../academic-periods/entities/academic-period.entity';

describe('AcademicTrafficLightService', () => {
  let service: AcademicTrafficLightService;
  let studentModel: Model<StudentDocument>;
  let enrollmentModel: Model<EnrollmentDocument>;
  let academicPeriodModel: Model<AcademicPeriodDocument>;

  const mockStudentId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockCourseId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockGroupId = '60d5ecb8b0a7c4b4b8b9b1a3';
  const mockPeriodId = '60d5ecb8b0a7c4b4b8b9b1a4';

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
    isActive: true,
  };

  const mockGroup = {
    _id: mockGroupId,
    groupNumber: 'A',
    courseId: mockCourse,
    periodId: mockPeriod,
  };

  const mockExecChain = {
    exec: jest.fn(),
  };

  const mockPopulateChain = {
    exec: jest.fn(),
    populate: jest.fn(),
  };

  beforeEach(async () => {
    const mockStudentModel = {
      findOne: jest.fn(),
      find: jest.fn(),
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

    const mockAcademicPeriodModel = {
      findOne: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicTrafficLightService,
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
          provide: getModelToken(AcademicPeriod.name),
          useValue: mockAcademicPeriodModel,
        },
      ],
    }).compile();

    service = module.get<AcademicTrafficLightService>(
      AcademicTrafficLightService,
    );
    studentModel = module.get<Model<StudentDocument>>(
      getModelToken(Student.name),
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

  describe('getTrafficLightColor', () => {
    it('should return green for passed status with valid grade', () => {
      const result = service.getTrafficLightColor(EnrollmentStatus.PASSED, 4.5);
      expect(result).toBe('green');
    });

    it('should return green for passed status with passing grade', () => {
      const result = service.getTrafficLightColor(EnrollmentStatus.PASSED, 3.0);
      expect(result).toBe('green');
    });

    it('should return red for passed status with failing grade (inconsistency)', () => {
      const result = service.getTrafficLightColor(EnrollmentStatus.PASSED, 2.5);
      expect(result).toBe('red');
    });

    it('should return blue for enrolled status', () => {
      const result = service.getTrafficLightColor(EnrollmentStatus.ENROLLED);
      expect(result).toBe('blue');
    });

    it('should return red for failed status', () => {
      const result = service.getTrafficLightColor(EnrollmentStatus.FAILED, 2.0);
      expect(result).toBe('red');
    });

    it('should return blue for undefined status', () => {
      const result = service.getTrafficLightColor(undefined as any);
      expect(result).toBe('blue');
    });
  });

  describe('getStudentAcademicStatus', () => {
    it('should return academic status with green color for excellent student', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const passedEnrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.8,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(passedEnrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getStudentAcademicStatus('student123');

      // Assert
      expect(result).toBeDefined();
      expect(result.studentId).toBe('STU001');
      expect(result.overallColor).toBe('green');
      expect(result.riskLevel).toBe('low');
      expect(result.gpa).toBeGreaterThan(4.0);
    });

    it('should return academic status with red color for at-risk student', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const mixedEnrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 2.8,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.FAILED,
          grade: 2.0,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.FAILED,
          grade: 1.5,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.FAILED,
          grade: 2.2,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(mixedEnrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getStudentAcademicStatus('student123');

      // Assert
      expect(result).toBeDefined();
      expect(result.overallColor).toBe('red');
      expect(result.riskLevel).toBe('high');
      expect(result.recommendations).toContain(
        'Schedule academic tutoring sessions',
      );
    });

    it('should return academic status with blue color for medium-risk student', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const mixedEnrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 3.3,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 3.2,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.FAILED,
          grade: 2.5,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(mixedEnrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getStudentAcademicStatus('student123');

      // Assert
      expect(result).toBeDefined();
      expect(result.overallColor).toBe('blue');
      expect(result.riskLevel).toBe('medium');
    });

    it('should throw NotFoundException when student not found by externalId or code', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValue(null);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      // Act & Assert
      await expect(
        service.getStudentAcademicStatus('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should find student by code when externalId not found', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(null); // First call by externalId
      mockExecChain.exec.mockResolvedValueOnce(mockStudent); // Second call by code
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockPopulateChain.exec.mockResolvedValue([]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getStudentAcademicStatus('STU001');

      // Assert
      expect(result.studentId).toBe('STU001');
      expect(studentModel.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStudentCourseStatuses', () => {
    it('should return categorized course statuses', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.ENROLLED,
          grade: null,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.FAILED,
          grade: 2.0,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getStudentCourseStatuses('student123');

      // Assert
      expect(result.passedCourses).toHaveLength(1);
      expect(result.currentCourses).toHaveLength(1);
      expect(result.failedCourses).toHaveLength(1);
      expect(result.passedCourses[0].color).toBe('green');
      expect(result.currentCourses[0].color).toBe('blue');
      expect(result.failedCourses[0].color).toBe('red');
    });

    it('should skip enrollments with missing data', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: null,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
        {
          groupId: { ...mockGroup, courseId: null },
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getStudentCourseStatuses('student123');

      // Assert
      expect(result.passedCourses).toHaveLength(0);
      expect(result.currentCourses).toHaveLength(0);
      expect(result.failedCourses).toHaveLength(0);
    });
  });

  describe('getAcademicTrafficLight', () => {
    it('should return traffic light without details', async () => {
      // Arrange
      // Mock for getStudentAcademicStatus and detectInconsistencies
      (studentModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockStudent),
      }));

      const enrollmentWithGrade = {
        groupId: {
          ...mockGroup,
          courseId: {
            ...mockCourse,
            credits: 3, // Ensure credits is set
          },
        },
        status: EnrollmentStatus.PASSED,
        grade: 4.5,
      };

      mockPopulateChain.exec.mockResolvedValue([enrollmentWithGrade]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      (academicPeriodModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPeriod),
      });

      // Act
      const result = await service.getAcademicTrafficLight('student123', false);

      // Assert
      expect(result).toBeDefined();
      expect(result.studentId).toBe('STU001');
      expect(result.status).toBe('green');
      expect(result.currentPeriod).toBe('2024-2');
      expect(result.inconsistent).toBe(false);
      expect(result.breakdown).toBeUndefined();
    });

    it('should return traffic light with detailed breakdown', async () => {
      // Arrange
      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
      ];

      // Mock all findOne calls separately for each method
      (studentModel.findOne as jest.Mock).mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockStudent),
      }));

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      (academicPeriodModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPeriod),
      });

      // Act
      const result = await service.getAcademicTrafficLight('student123', true);

      // Assert
      expect(result).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.passedCourses).toBeDefined();
      expect(result.breakdown.currentCourses).toBeDefined();
      expect(result.breakdown.failedCourses).toBeDefined();
      expect(result.breakdown.metrics).toBeDefined();
    });

    it('should return null currentPeriod when no active period', async () => {
      // Arrange
      (studentModel.findOne as jest.Mock).mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValueOnce(mockStudent) // getStudentAcademicStatus
          .mockResolvedValueOnce(mockStudent), // detectInconsistencies
      });

      mockPopulateChain.exec.mockResolvedValue([]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      (academicPeriodModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.getAcademicTrafficLight('student123', false);

      // Assert
      expect(result.currentPeriod).toBeNull();
    });
  });

  describe('detectInconsistencies', () => {
    it('should detect passed course without grade', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: null,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(result).toContain('Passed course MAT101 missing grade');
    });

    it('should detect invalid grade values', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 6.0,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(result.some((msg) => msg.includes('invalid grade'))).toBe(true);
    });

    it('should detect passed course with failing grade', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 2.5,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(
        result.some((msg) => msg.includes('below passing threshold')),
      ).toBe(true);
    });

    it('should detect duplicate passed courses', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.0,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(
        result.some((msg) => msg.includes('Duplicate passed courses')),
      ).toBe(true);
    });

    it('should detect missing group or course information', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: null,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(result).toContain('Enrollment with missing group information');
    });

    it('should return empty array when no inconsistencies', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(result).toEqual([]);
    });

    it('should detect enrolled course with grade (inconsistency)', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.ENROLLED,
          grade: 4.0,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(
        result.some((msg) => msg.includes('should not have grade yet')),
      ).toBe(true);
    });

    it('should detect failed course without grade', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.FAILED,
          grade: null,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(result.some((msg) => msg.includes('missing grade'))).toBe(true);
    });

    it('should detect failed course with passing grade', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.FAILED,
          grade: 4.0,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(
        result.some((msg) => msg.includes('marked as FAILED but grade')),
      ).toBe(true);
    });

    it('should handle error and return error message', async () => {
      // Arrange
      mockExecChain.exec.mockRejectedValue(new Error('Database error'));
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      // Act
      const result = await service.detectInconsistencies('student123');

      // Assert
      expect(
        result.some((msg) => msg.includes('Error detecting inconsistencies')),
      ).toBe(true);
    });
  });

  describe('calculateAverageGradePerSemester', () => {
    it('should calculate average grades per semester', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      const enrollments = [
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.0,
        },
      ];

      mockPopulateChain.exec.mockResolvedValue(enrollments);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result =
        await service.calculateAverageGradePerSemester('student123');

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('period');
      expect(result[0]).toHaveProperty('averageGrade');
      expect(result[0]).toHaveProperty('totalCredits');
      expect(result[0]).toHaveProperty('courseCount');
    });

    it('should handle empty enrollments', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValueOnce(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockPopulateChain.exec.mockResolvedValue([]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result =
        await service.calculateAverageGradePerSemester('student123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getAcademicStatistics', () => {
    it('should return academic statistics for all students', async () => {
      // Arrange
      (studentModel.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockStudent]),
      });

      (studentModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudent),
      });

      mockPopulateChain.exec.mockResolvedValue([
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
      ]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getAcademicStatistics();

      // Assert
      expect(result).toBeDefined();
      expect(result.totalStudents).toBe(1);
      expect(result).toHaveProperty('greenStudents');
      expect(result).toHaveProperty('blueStudents');
      expect(result).toHaveProperty('redStudents');
      expect(result).toHaveProperty('averageGPA');
    });

    it('should handle errors for individual students gracefully', async () => {
      // Arrange
      (studentModel.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockStudent, mockStudent]),
      });

      // First call throws error, second succeeds
      let callCount = 0;
      (studentModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('Database error'));
          }
          return Promise.resolve(mockStudent);
        }),
      });

      mockPopulateChain.exec.mockResolvedValue([]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getAcademicStatistics();

      // Assert
      expect(result.totalStudents).toBe(2);
    });
  });

  describe('getStudentTrafficLightReport', () => {
    it('should return complete traffic light report', async () => {
      // Arrange
      mockExecChain.exec.mockResolvedValue(mockStudent);
      (studentModel.findOne as jest.Mock).mockReturnValue(mockExecChain);

      mockPopulateChain.exec.mockResolvedValue([
        {
          groupId: mockGroup,
          status: EnrollmentStatus.PASSED,
          grade: 4.5,
        },
      ]);
      mockPopulateChain.populate.mockReturnValue(mockPopulateChain);
      (enrollmentModel.find as jest.Mock).mockReturnValue(mockPopulateChain);

      // Act
      const result = await service.getStudentTrafficLightReport('student123');

      // Assert
      expect(result).toBeDefined();
      expect(result.studentInfo).toBeDefined();
      expect(result.courseStatuses).toBeDefined();
      expect(result.studentInfo.studentId).toBe('STU001');
    });
  });
});
