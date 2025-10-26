import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SchedulesController } from '../schedules/controllers/schedules.controller';
import { StudentScheduleService } from '../schedules/services/student-schedule.service';
import { ScheduleValidationService } from '../schedules/services/schedule-validation.service';
import { AcademicTrafficLightService } from '../academic-traffic-light/services/academic-traffic-light.service';

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
      expect(result.conflicts).toEqual([]);
      expect(result.emptySchedule).toBe(false);
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
    });
  });
});
