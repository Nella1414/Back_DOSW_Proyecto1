import { Test, TestingModule } from '@nestjs/testing';
import { AcademicPeriodsController } from '../academic-periods/academic-periods.controller';
import { AcademicPeriodsService } from '../academic-periods/services/academic-periods.service';
import { CreateAcademicPeriodDto } from '../academic-periods/dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from '../academic-periods/dto/update-academic-period.dto';
import { ConflictException } from '@nestjs/common';

describe('AcademicPeriodsController', () => {
  let controller: AcademicPeriodsController;
  let service: AcademicPeriodsService;

  const mockPeriod = {
    _id: 'period123',
    code: '2024-2',
    name: 'Segundo Semestre 2024',
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-12-15'),
    isActive: true,
    allowChangeRequests: true,
    isEnrollmentOpen: true,
    status: 'ACTIVE',
  };

  const mockAcademicPeriodsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllWithFilters: jest.fn(),
    findOne: jest.fn(),
    getActivePeriod: jest.fn(),
    getPeriodsAllowingChanges: jest.fn(),
    getPeriodsWithOpenEnrollment: jest.fn(),
    update: jest.fn(),
    setActivePeriod: jest.fn(),
    remove: jest.fn(),
    isEnrollmentOpen: jest.fn(),
    allowsChangeRequests: jest.fn(),
    validatePeriodDates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicPeriodsController],
      providers: [
        {
          provide: AcademicPeriodsService,
          useValue: mockAcademicPeriodsService,
        },
      ],
    }).compile();

    controller = module.get<AcademicPeriodsController>(
      AcademicPeriodsController,
    );
    service = module.get<AcademicPeriodsService>(AcademicPeriodsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new academic period', async () => {
      const createDto: CreateAcademicPeriodDto = {
        code: '2025-1',
        name: 'Primer Semestre 2025',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-06-15'),
        status: 'ACTIVE',
        isActive: false,
        allowChangeRequests: true,
        isEnrollmentOpen: true,
      };

      mockAcademicPeriodsService.validatePeriodDates.mockResolvedValue(
        undefined,
      );
      mockAcademicPeriodsService.create.mockResolvedValue(mockPeriod);

      const result = await controller.create(createDto);

      expect(service.validatePeriodDates).toHaveBeenCalled();
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockPeriod);
    });
  });

  describe('findAll', () => {
    it('should return all periods without filters', async () => {
      const periods = [mockPeriod];
      mockAcademicPeriodsService.findAll.mockResolvedValue(periods);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(periods);
    });
  });

  describe('getActivePeriod', () => {
    it('should return the active period', async () => {
      mockAcademicPeriodsService.getActivePeriod.mockResolvedValue(mockPeriod);

      const result = await controller.getActivePeriod();

      expect(service.getActivePeriod).toHaveBeenCalled();
      expect(result).toEqual(mockPeriod);
    });
  });

  describe('setActivePeriod', () => {
    it('should activate a period', async () => {
      const activatedPeriod = { ...mockPeriod, isActive: true };
      mockAcademicPeriodsService.setActivePeriod.mockResolvedValue(
        activatedPeriod,
      );

      const result = await controller.setActivePeriod('period123');

      expect(service.setActivePeriod).toHaveBeenCalledWith('period123');
      expect(result).toEqual(activatedPeriod);
    });
  });

  describe('remove', () => {
    it('should remove a period', async () => {
      mockAcademicPeriodsService.remove.mockResolvedValue(undefined);

      await controller.remove('period123');

      expect(service.remove).toHaveBeenCalledWith('period123');
    });
  });
});
