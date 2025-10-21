import { Test, TestingModule } from '@nestjs/testing';
import { AcademicTrafficLightController } from '../academic-traffic-light/academic-traffic-light.controller';
import { AcademicTrafficLightService } from '../academic-traffic-light/services/academic-traffic-light.service';
import { RolesService } from '../roles/services/roles.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AcademicTrafficLightController', () => {
  let controller: AcademicTrafficLightController;
  let service: AcademicTrafficLightService;

  const mockAcademicTrafficLightService = {
    getAcademicStatistics: jest.fn(),
    getStudentAcademicStatus: jest.fn(),
    getStudentTrafficLightReport: jest.fn(),
  };

  const mockRolesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByName: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockStatistics = {
    totalStudents: 100,
    greenStudents: 60,
    yellowStudents: 30,
    redStudents: 10,
    averageGPA: 3.8,
    greenPercentage: 60,
    yellowPercentage: 30,
    redPercentage: 10,
  };

  const mockStudentStatus = {
    studentId: 'STU001',
    studentName: 'Juan Pérez',
    currentSemester: 5,
    overallColor: 'green',
    passedCredits: 90,
    totalCredits: 120,
    gpa: 4.2,
    riskLevel: 'low',
    recommendations: ['Continue excellent academic performance'],
  };

  const mockStudentReport = {
    studentInfo: mockStudentStatus,
    courseStatuses: {
      passedCourses: [],
      currentCourses: [],
      failedCourses: [],
    },
  };

  const mockRequest = {
    user: {
      sub: 'user123',
      externalId: 'STU001',
      roles: ['STUDENT'],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicTrafficLightController],
      providers: [
        {
          provide: AcademicTrafficLightService,
          useValue: mockAcademicTrafficLightService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<AcademicTrafficLightController>(
      AcademicTrafficLightController,
    );
    service = module.get<AcademicTrafficLightService>(
      AcademicTrafficLightService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAcademicStatistics', () => {
    it('should return academic statistics', async () => {
      mockAcademicTrafficLightService.getAcademicStatistics.mockResolvedValue(
        mockStatistics,
      );

      const result = await controller.getAcademicStatistics();

      expect(service.getAcademicStatistics).toHaveBeenCalled();
      expect(result).toEqual(mockStatistics);
    });

    it('should call service method once', async () => {
      mockAcademicTrafficLightService.getAcademicStatistics.mockResolvedValue(
        mockStatistics,
      );

      await controller.getAcademicStatistics();

      expect(service.getAcademicStatistics).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStudentAcademicStatus', () => {
    it('should return student academic status', async () => {
      mockAcademicTrafficLightService.getStudentAcademicStatus.mockResolvedValue(
        mockStudentStatus,
      );

      const result = await controller.getStudentAcademicStatus(
        { studentId: 'STU001' },
        mockRequest,
      );

      expect(service.getStudentAcademicStatus).toHaveBeenCalledWith('STU001');
      expect(result).toEqual(mockStudentStatus);
    });

    it('should pass studentId parameter correctly', async () => {
      mockAcademicTrafficLightService.getStudentAcademicStatus.mockResolvedValue(
        mockStudentStatus,
      );

      await controller.getStudentAcademicStatus(
        { studentId: 'STU001' },
        mockRequest,
      );

      expect(service.getStudentAcademicStatus).toHaveBeenCalledWith('STU001');
    });
  });

  describe('getStudentTrafficLightReport', () => {
    it('should return complete traffic light report', async () => {
      mockAcademicTrafficLightService.getStudentTrafficLightReport.mockResolvedValue(
        mockStudentReport,
      );

      const result = await controller.getStudentTrafficLightReport(
        { studentId: 'STU001' },
        mockRequest,
      );

      expect(service.getStudentTrafficLightReport).toHaveBeenCalledWith(
        'STU001',
      );
      expect(result).toEqual(mockStudentReport);
    });

    it('should include student info and course statuses', async () => {
      mockAcademicTrafficLightService.getStudentTrafficLightReport.mockResolvedValue(
        mockStudentReport,
      );

      const result = await controller.getStudentTrafficLightReport(
        { studentId: 'STU001' },
        mockRequest,
      );

      expect(result).toHaveProperty('studentInfo');
      expect(result).toHaveProperty('courseStatuses');
    });
  });

  describe('findAll (legacy endpoint)', () => {
    it('should return academic statistics', async () => {
      mockAcademicTrafficLightService.getAcademicStatistics.mockResolvedValue(
        mockStatistics,
      );

      const result = await controller.findAll();

      expect(service.getAcademicStatistics).toHaveBeenCalled();
      expect(result).toEqual(mockStatistics);
    });
  });

  describe('findOne (legacy endpoint)', () => {
    it('should return student traffic light report', async () => {
      mockAcademicTrafficLightService.getStudentTrafficLightReport.mockResolvedValue(
        mockStudentReport,
      );

      const result = await controller.findOne(
        { studentId: 'STU001' },
        mockRequest,
      );

      expect(service.getStudentTrafficLightReport).toHaveBeenCalledWith(
        'STU001',
      );
      expect(result).toEqual(mockStudentReport);
    });
  });
});
