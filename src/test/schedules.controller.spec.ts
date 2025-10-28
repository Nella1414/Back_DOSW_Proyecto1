import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, HttpException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { SchedulesController } from '../schedules/controllers/schedules.controller';
import { StudentScheduleService } from '../schedules/services/student-schedule.service';
import { ScheduleValidationService } from '../schedules/services/schedule-validation.service';
import { AcademicTrafficLightService } from '../academic-traffic-light/services/academic-traffic-light.service';
import { Student } from '../students/entities/student.entity';

describe('SchedulesController', () => {
  let controller: SchedulesController;

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

  const mockStudentModel = {
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    }),
  };

  const mockSchedule = {
    studentId: 'STU001',
    studentName: 'Juan Pérez',
    currentSemester: 5,
    period: '2024-2',
    schedule: [
      {
        courseCode: 'MAT101',
        courseName: 'Matemáticas I',
        group: 'A',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        room: 'Aula 101',
      },
    ],
  };

  beforeEach(async () => {
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
        {
          provide: getModelToken(Student.name),
          useValue: mockStudentModel,
        },
      ],
    }).compile();

    controller = module.get<SchedulesController>(SchedulesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentSchedule', () => {
    it('should return current schedule for authenticated user', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      mockStudentScheduleService.getCurrentSchedule.mockResolvedValue(
        mockSchedule,
      );
      mockScheduleValidationService.detectScheduleConflicts.mockResolvedValue(
        [],
      );

      const result = await controller.getCurrentSchedule(mockReq);

      expect(result.schedule).toBeDefined();
      expect(result.emptySchedule).toBe(false);
      expect(mockStudentScheduleService.getCurrentSchedule).toHaveBeenCalledWith('student123');
    });

    it('should return empty schedule when no enrollments found', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      mockStudentScheduleService.getCurrentSchedule.mockResolvedValue({
        schedule: [],
        period: '2024-2',
      });

      const result = await controller.getCurrentSchedule(mockReq);

      expect(result.emptySchedule).toBe(true);
      expect(result.message).toBe('No enrollments found for current period');
    });

    it('should detect schedule conflicts', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      const conflicts = [
        {
          day: 'Monday',
          dayOfWeek: 1,
          course1: { code: 'MAT101', name: 'Math', group: 'A', time: '08:00-10:00' },
          course2: { code: 'FIS101', name: 'Physics', group: 'B', time: '09:00-11:00' },
          conflictType: 'TIME_OVERLAP',
        },
      ];

      mockStudentScheduleService.getCurrentSchedule.mockResolvedValue(
        mockSchedule,
      );
      mockScheduleValidationService.detectScheduleConflicts.mockResolvedValue(
        conflicts,
      );

      const result = await controller.getCurrentSchedule(mockReq);

      expect(result).toHaveProperty('conflicts');
      expect(Array.isArray((result as any).conflicts)).toBe(true);
    });

    it('should allow admin to access other student schedules', async () => {
      const mockReq = {
        user: { externalId: 'admin123', roles: ['ADMIN'] },
      };

      mockStudentScheduleService.getCurrentSchedule.mockResolvedValue(
        mockSchedule,
      );
      mockScheduleValidationService.detectScheduleConflicts.mockResolvedValue(
        [],
      );

      await controller.getCurrentSchedule(mockReq, 'student456');

      expect(
        mockStudentScheduleService.getCurrentSchedule,
      ).toHaveBeenCalledWith('student456');
    });

    it('should throw ForbiddenException when student tries to access another schedule', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      await expect(
        controller.getCurrentSchedule(mockReq, 'student456'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle student not found error', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      mockStudentScheduleService.getCurrentSchedule.mockRejectedValue(
        new Error('Student not found'),
      );

      await expect(
        controller.getCurrentSchedule(mockReq),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getHistoricalSchedules', () => {
    it('should return historical schedules', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      const historicalData = {
        studentId: 'STU001',
        periods: [{ periodCode: '2024-1', courses: [] }],
      };

      mockStudentScheduleService.getHistoricalSchedules.mockResolvedValue(
        historicalData,
      );

      const result = await controller.getHistoricalSchedules(mockReq);

      expect(result.periods).toBeDefined();
      expect(result.emptyHistory).toBe(false);
    });

    it('should return empty history when no periods found', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      mockStudentScheduleService.getHistoricalSchedules.mockResolvedValue({
        studentId: 'STU001',
        periods: [],
      });

      const result = await controller.getHistoricalSchedules(mockReq);

      expect(result.emptyHistory).toBe(true);
      expect(result.message).toBe('No historical academic data found');
    });

    it('should allow admin to access other student historical schedules', async () => {
      const mockReq = {
        user: { externalId: 'admin123', roles: ['ADMIN'] },
      };

      const historicalData = {
        studentId: 'STU001',
        periods: [{ periodCode: '2024-1', courses: [] }],
      };

      mockStudentScheduleService.getHistoricalSchedules.mockResolvedValue(
        historicalData,
      );

      await controller.getHistoricalSchedules(mockReq, 'student456');

      expect(mockStudentScheduleService.getHistoricalSchedules).toHaveBeenCalledWith(
        'student456',
        undefined,
        undefined,
      );
    });

    it('should throw ForbiddenException when student tries to access another historical schedule', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      await expect(
        controller.getHistoricalSchedules(mockReq, 'student456'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle date range filters', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      const historicalData = {
        studentId: 'STU001',
        periods: [{ periodCode: '2024-1', courses: [] }],
      };

      mockStudentScheduleService.getHistoricalSchedules.mockResolvedValue(
        historicalData,
      );

      await controller.getHistoricalSchedules(mockReq, undefined, '2024-01-01', '2024-06-30');

      expect(mockStudentScheduleService.getHistoricalSchedules).toHaveBeenCalledWith(
        'student123',
        '2024-01-01',
        '2024-06-30',
      );
    });

    it('should handle HttpException from service', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      mockStudentScheduleService.getHistoricalSchedules.mockRejectedValue(
        new HttpException('Invalid period', 400),
      );

      await expect(
        controller.getHistoricalSchedules(mockReq),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getHistoricalScheduleByPeriod', () => {
    it('should return historical schedule for a specific period', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      const periodSchedule = {
        studentId: 'STU001',
        periodCode: '2024-1',
        courses: [],
      };

      mockScheduleValidationService.validateClosedPeriod.mockResolvedValue(true);
      mockStudentScheduleService.getHistoricalScheduleByPeriod.mockResolvedValue(
        periodSchedule,
      );

      const result = await controller.getHistoricalScheduleByPeriod(
        mockReq,
        '2024-1',
      );

      expect(result).toEqual(periodSchedule);
      expect(mockScheduleValidationService.validateClosedPeriod).toHaveBeenCalledWith('2024-1');
    });

    it('should throw HttpException when period is not closed', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      mockScheduleValidationService.validateClosedPeriod.mockResolvedValue(false);

      await expect(
        controller.getHistoricalScheduleByPeriod(mockReq, '2024-2'),
      ).rejects.toThrow(HttpException);
    });

    it('should allow admin to access other student period schedules', async () => {
      const mockReq = {
        user: { externalId: 'admin123', roles: ['ADMIN'] },
      };

      const periodSchedule = {
        studentId: 'STU001',
        periodCode: '2024-1',
        courses: [],
      };

      mockScheduleValidationService.validateClosedPeriod.mockResolvedValue(true);
      mockStudentScheduleService.getHistoricalScheduleByPeriod.mockResolvedValue(
        periodSchedule,
      );

      await controller.getHistoricalScheduleByPeriod(
        mockReq,
        '2024-1',
        'student456',
      );

      expect(mockStudentScheduleService.getHistoricalScheduleByPeriod).toHaveBeenCalledWith(
        'student456',
        '2024-1',
      );
    });

    it('should throw ForbiddenException when student tries to access another period schedule', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      await expect(
        controller.getHistoricalScheduleByPeriod(mockReq, '2024-1', 'student456'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAcademicTrafficLight', () => {
    it('should return traffic light status', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      const trafficLight = {
        studentId: 'STU001',
        status: 'green',
        currentPeriod: '2024-2',
      };

      mockAcademicTrafficLightService.getAcademicTrafficLight.mockResolvedValue(
        trafficLight,
      );

      const result = await controller.getAcademicTrafficLight(mockReq);

      expect(result).toEqual(trafficLight);
      expect(mockAcademicTrafficLightService.getAcademicTrafficLight).toHaveBeenCalledWith(
        'student123',
        false,
      );
    });

    it('should include detailed breakdown when requested', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      const trafficLight = {
        studentId: 'STU001',
        status: 'yellow',
        currentPeriod: '2024-2',
        breakdown: { passed: 5, failed: 2 },
      };

      mockAcademicTrafficLightService.getAcademicTrafficLight.mockResolvedValue(
        trafficLight,
      );

      const result = await controller.getAcademicTrafficLight(mockReq, undefined, 'true');

      expect(result).toEqual(trafficLight);
      expect(mockAcademicTrafficLightService.getAcademicTrafficLight).toHaveBeenCalledWith(
        'student123',
        true,
      );
    });

    it('should allow admin to access other student traffic light', async () => {
      const mockReq = {
        user: { externalId: 'admin123', roles: ['ADMIN'] },
      };

      const trafficLight = {
        studentId: 'STU001',
        status: 'red',
        currentPeriod: '2024-2',
      };

      mockAcademicTrafficLightService.getAcademicTrafficLight.mockResolvedValue(
        trafficLight,
      );

      await controller.getAcademicTrafficLight(mockReq, 'student456');

      expect(mockAcademicTrafficLightService.getAcademicTrafficLight).toHaveBeenCalledWith(
        'student456',
        false,
      );
    });

    it('should throw ForbiddenException when student tries to access another traffic light', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      await expect(
        controller.getAcademicTrafficLight(mockReq, 'student456'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle service errors', async () => {
      const mockReq = {
        user: { externalId: 'student123', roles: ['STUDENT'] },
      };

      mockAcademicTrafficLightService.getAcademicTrafficLight.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.getAcademicTrafficLight(mockReq),
      ).rejects.toThrow(HttpException);
    });
  });
});
