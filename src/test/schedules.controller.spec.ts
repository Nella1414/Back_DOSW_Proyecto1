import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesController } from '../schedules/controllers/schedules.controller';
import { StudentScheduleService } from '../schedules/services/student-schedule.service';
import { ScheduleValidationService } from '../schedules/services/schedule-validation.service';
import { AcademicTrafficLightService } from '../schedules/services/academic-traffic-light.service';
import { HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';

describe('SchedulesController', () => {
  let controller: SchedulesController;
  let studentScheduleService: jest.Mocked<StudentScheduleService>;
  let scheduleValidationService: jest.Mocked<ScheduleValidationService>;
  let academicTrafficLightService: jest.Mocked<AcademicTrafficLightService>;

  const mockRequest = {
    user: {
      externalId: 'student123',
      roles: ['STUDENT'],
    },
  };

  const mockSchedule = {
    studentId: 'student123',
    studentName: 'John Doe',
    currentSemester: 5,
    period: '2024-2',
    schedule: [
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
            professorName: undefined,
          },
        ],
      },
    ],
  };

  const mockTrafficLight = {
    studentId: 'student123',
    studentName: 'John Doe',
    currentSemester: 5,
    status: 'green',
    progressPercentage: 75,
    passedCredits: 90,
    totalCredits: 120,
    gpa: 4.1,
    riskLevel: 'low',
    recommendations: ['Continue excellent academic performance'],
    currentPeriod: '2024-2',
    inconsistent: false,
    inconsistencies: [],
  };

  beforeEach(async () => {
    const mockStudentScheduleService = {
      getCurrentSchedule: jest.fn(),
      getHistoricalSchedules: jest.fn(),
      getHistoricalScheduleByPeriod: jest.fn(),
    };

    const mockScheduleValidationService = {
      detectScheduleConflicts: jest.fn(),
      validateClosedPeriod: jest.fn(),
    };

    const mockAcademicTrafficLightService = {
      getAcademicTrafficLight: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulesController],
      providers: [
        {
          provide: StudentScheduleService,
          useValue: mockStudentScheduleService,
        },
        {
          provide: ScheduleValidationService,
          useValue: mockScheduleValidationService,
        },
        {
          provide: AcademicTrafficLightService,
          useValue: mockAcademicTrafficLightService,
        },
      ],
    }).compile();

    controller = module.get<SchedulesController>(SchedulesController);
    studentScheduleService = module.get(StudentScheduleService);
    scheduleValidationService = module.get(ScheduleValidationService);
    academicTrafficLightService = module.get(AcademicTrafficLightService);
  });

  describe('getCurrentSchedule', () => {
    it('should return current schedule for authenticated user', async () => {
      // Arrange
      studentScheduleService.getCurrentSchedule.mockResolvedValue(mockSchedule);
      scheduleValidationService.detectScheduleConflicts.mockResolvedValue([]);

      // Act
      const result = await controller.getCurrentSchedule(mockRequest);

      // Assert
      expect(studentScheduleService.getCurrentSchedule).toHaveBeenCalledWith(
        'student123',
      );
      expect(
        scheduleValidationService.detectScheduleConflicts,
      ).toHaveBeenCalledWith(mockSchedule.schedule);
      expect(result).toEqual({
        ...mockSchedule,
        conflicts: [],
        emptySchedule: false,
        latency: expect.any(Number),
      });
    });

    it('should return empty schedule when student has no enrollments', async () => {
      // Arrange
      const emptySchedule = { ...mockSchedule, schedule: [] };
      studentScheduleService.getCurrentSchedule.mockResolvedValue(
        emptySchedule,
      );

      // Act
      const result = await controller.getCurrentSchedule(mockRequest);

      // Assert
      expect(result).toEqual({
        schedule: [],
        emptySchedule: true,
        message: 'No enrollments found for current period',
        studentId: 'student123',
        currentPeriod: '2024-2',
      });
    });

    it('should throw forbidden exception when student tries to access other student schedule', async () => {
      // Act & Assert
      await expect(
        controller.getCurrentSchedule(mockRequest, 'other-student'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access other student schedule', async () => {
      // Arrange
      const adminRequest = {
        user: { externalId: 'admin123', roles: ['ADMIN'] },
      };
      studentScheduleService.getCurrentSchedule.mockResolvedValue(mockSchedule);
      scheduleValidationService.detectScheduleConflicts.mockResolvedValue([]);

      // Act
      const result = await controller.getCurrentSchedule(
        adminRequest,
        'student123',
      );

      // Assert
      expect(studentScheduleService.getCurrentSchedule).toHaveBeenCalledWith(
        'student123',
      );
      expect(result).toBeDefined();
    });

    it('should throw HttpException when student not found', async () => {
      // Arrange
      studentScheduleService.getCurrentSchedule.mockRejectedValue(
        new Error('Student not found'),
      );

      // Act & Assert
      await expect(controller.getCurrentSchedule(mockRequest)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getHistoricalSchedules', () => {
    const mockHistoricalData = {
      studentId: 'student123',
      periods: [
        {
          periodId: 'period123',
          periodCode: '2024-1',
          periodName: 'Primer Semestre 2024',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-15'),
          enrollmentCount: 6,
        },
      ],
    };

    it('should return historical schedules', async () => {
      // Arrange
      studentScheduleService.getHistoricalSchedules.mockResolvedValue(
        mockHistoricalData,
      );

      // Act
      const result = await controller.getHistoricalSchedules(mockRequest);

      // Assert
      expect(
        studentScheduleService.getHistoricalSchedules,
      ).toHaveBeenCalledWith('student123', undefined, undefined);
      expect(result).toEqual({
        ...mockHistoricalData,
        emptyHistory: false,
      });
    });

    it('should return empty history when no periods found', async () => {
      // Arrange
      const emptyData = { studentId: 'student123', periods: [] };
      studentScheduleService.getHistoricalSchedules.mockResolvedValue(
        emptyData,
      );

      // Act
      const result = await controller.getHistoricalSchedules(mockRequest);

      // Assert
      expect(result).toEqual({
        periods: [],
        emptyHistory: true,
        message: 'No historical academic data found',
        studentId: 'student123',
      });
    });

    it('should support date filtering', async () => {
      // Arrange
      studentScheduleService.getHistoricalSchedules.mockResolvedValue(
        mockHistoricalData,
      );

      // Act
      await controller.getHistoricalSchedules(
        mockRequest,
        undefined,
        '2024-01-01',
        '2024-12-31',
      );

      // Assert
      expect(
        studentScheduleService.getHistoricalSchedules,
      ).toHaveBeenCalledWith('student123', '2024-01-01', '2024-12-31');
    });
  });

  describe('getHistoricalScheduleByPeriod', () => {
    const mockHistoricalSchedule = {
      studentId: 'student123',
      period: {
        id: 'period123',
        code: '2024-1',
        status: 'CLOSED',
      },
      schedule: mockSchedule.schedule,
      coursesWithResults: [],
    };

    it('should return historical schedule for closed period', async () => {
      // Arrange
      scheduleValidationService.validateClosedPeriod.mockResolvedValue(true);
      studentScheduleService.getHistoricalScheduleByPeriod.mockResolvedValue(
        mockHistoricalSchedule,
      );

      // Act
      const result = await controller.getHistoricalScheduleByPeriod(
        mockRequest,
        'period123',
      );

      // Assert
      expect(
        scheduleValidationService.validateClosedPeriod,
      ).toHaveBeenCalledWith('period123');
      expect(
        studentScheduleService.getHistoricalScheduleByPeriod,
      ).toHaveBeenCalledWith('student123', 'period123');
      expect(result).toEqual(mockHistoricalSchedule);
    });

    it('should throw bad request for non-closed period', async () => {
      // Arrange
      scheduleValidationService.validateClosedPeriod.mockResolvedValue(false);

      // Act & Assert
      await expect(
        controller.getHistoricalScheduleByPeriod(mockRequest, 'period123'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getAcademicTrafficLight', () => {
    it('should return academic traffic light status', async () => {
      // Arrange
      academicTrafficLightService.getAcademicTrafficLight.mockResolvedValue(
        mockTrafficLight,
      );

      // Act
      const result = await controller.getAcademicTrafficLight(mockRequest);

      // Assert
      expect(
        academicTrafficLightService.getAcademicTrafficLight,
      ).toHaveBeenCalledWith('student123', false);
      expect(result).toEqual(mockTrafficLight);
    });

    it('should return detailed traffic light when details=true', async () => {
      // Arrange
      const detailedTrafficLight = {
        ...mockTrafficLight,
        breakdown: {
          passedCourses: [],
          currentCourses: [],
          failedCourses: [],
          metrics: {},
        },
      };
      academicTrafficLightService.getAcademicTrafficLight.mockResolvedValue(
        detailedTrafficLight,
      );

      // Act
      const result = await controller.getAcademicTrafficLight(
        mockRequest,
        undefined,
        'true',
      );

      // Assert
      expect(
        academicTrafficLightService.getAcademicTrafficLight,
      ).toHaveBeenCalledWith('student123', true);
      expect(result).toEqual(detailedTrafficLight);
    });

    it('should throw forbidden exception for unauthorized access', async () => {
      // Act & Assert
      await expect(
        controller.getAcademicTrafficLight(mockRequest, 'other-student'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
