import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AcademicPeriodsService } from '../academic-periods/services/academic-periods.service';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../academic-periods/entities/academic-period.entity';
import { CreateAcademicPeriodDto } from '../academic-periods/dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from '../academic-periods/dto/update-academic-period.dto';

describe('AcademicPeriodsService', () => {
  let service: AcademicPeriodsService;
  let model: Model<AcademicPeriodDocument>;

  const mockPeriodId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockPeriod = {
    _id: mockPeriodId,
    code: '2024-2',
    name: 'Segundo Semestre 2024',
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-12-15'),
    isActive: false,
    allowChangeRequests: true,
    isEnrollmentOpen: true,
    status: 'ACTIVE',
    save: jest.fn().mockResolvedValue(this),
  };

  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    new: jest.fn(),
    constructor: jest.fn(),
  };

  const mockSortChain = {
    exec: jest.fn(),
    sort: jest.fn(),
  };

  const mockExecChain = {
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicPeriodsService,
        {
          provide: getModelToken(AcademicPeriod.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<AcademicPeriodsService>(AcademicPeriodsService);
    model = module.get<Model<AcademicPeriodDocument>>(
      getModelToken(AcademicPeriod.name),
    );

    // Configure chain methods
    mockSortChain.sort.mockReturnValue(mockSortChain);
    mockModel.find.mockReturnValue(mockSortChain);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all academic periods sorted by start date', async () => {
      const periods = [mockPeriod];
      mockSortChain.exec.mockResolvedValue(periods);

      const result = await service.findAll();

      expect(mockModel.find).toHaveBeenCalled();
      expect(mockSortChain.sort).toHaveBeenCalledWith({ startDate: -1 });
      expect(result).toEqual(periods);
    });

    it('should return empty array when no periods exist', async () => {
      mockSortChain.exec.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an academic period by id', async () => {
      mockExecChain.exec.mockResolvedValue(mockPeriod);
      mockModel.findById.mockReturnValue(mockExecChain);

      const result = await service.findOne(mockPeriodId);

      expect(mockModel.findById).toHaveBeenCalledWith(mockPeriodId);
      expect(result).toEqual(mockPeriod);
    });

    it('should throw NotFoundException when period is not found', async () => {
      mockExecChain.exec.mockResolvedValue(null);
      mockModel.findById.mockReturnValue(mockExecChain);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        'Academic period with ID nonexistent-id not found',
      );
    });
  });

  describe('findByCode', () => {
    it('should return an academic period by code', async () => {
      mockExecChain.exec.mockResolvedValue(mockPeriod);
      mockModel.findOne.mockReturnValue(mockExecChain);

      const result = await service.findByCode('2024-2');

      expect(mockModel.findOne).toHaveBeenCalledWith({ code: '2024-2' });
      expect(result).toEqual(mockPeriod);
    });

    it('should throw NotFoundException when period code is not found', async () => {
      mockExecChain.exec.mockResolvedValue(null);
      mockModel.findOne.mockReturnValue(mockExecChain);

      await expect(service.findByCode('invalid-code')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getActivePeriod', () => {
    it('should return the active academic period', async () => {
      const activePeriod = { ...mockPeriod, isActive: true };
      mockExecChain.exec.mockResolvedValue(activePeriod);
      mockModel.findOne.mockReturnValue(mockExecChain);

      const result = await service.getActivePeriod();

      expect(mockModel.findOne).toHaveBeenCalledWith({ isActive: true });
      expect(result).toEqual(activePeriod);
    });

    it('should return null when no active period exists', async () => {
      mockExecChain.exec.mockResolvedValue(null);
      mockModel.findOne.mockReturnValue(mockExecChain);

      const result = await service.getActivePeriod();

      expect(result).toBeNull();
    });
  });

  describe('getPeriodsAllowingChanges', () => {
    it('should return periods that allow change requests', async () => {
      const periods = [mockPeriod];
      mockExecChain.exec.mockResolvedValue(periods);
      mockModel.find.mockReturnValue(mockExecChain);

      const result = await service.getPeriodsAllowingChanges();

      expect(mockModel.find).toHaveBeenCalledWith({ allowChangeRequests: true });
      expect(result).toEqual(periods);
    });
  });

  describe('getPeriodsWithOpenEnrollment', () => {
    it('should return periods with open enrollment', async () => {
      const periods = [mockPeriod];
      mockExecChain.exec.mockResolvedValue(periods);
      mockModel.find.mockReturnValue(mockExecChain);

      const result = await service.getPeriodsWithOpenEnrollment();

      expect(mockModel.find).toHaveBeenCalledWith({ isEnrollmentOpen: true });
      expect(result).toEqual(periods);
    });
  });

  describe('isEnrollmentOpen', () => {
    it('should return true when enrollment is open', async () => {
      const periodWithOpenEnrollment = { ...mockPeriod, isEnrollmentOpen: true };
      mockExecChain.exec.mockResolvedValue(periodWithOpenEnrollment);
      mockModel.findById.mockReturnValue(mockExecChain);

      const result = await service.isEnrollmentOpen(mockPeriodId);

      expect(result).toBe(true);
    });

    it('should return false when enrollment is closed', async () => {
      const periodWithClosedEnrollment = {
        ...mockPeriod,
        isEnrollmentOpen: false,
      };
      mockExecChain.exec.mockResolvedValue(periodWithClosedEnrollment);
      mockModel.findById.mockReturnValue(mockExecChain);

      const result = await service.isEnrollmentOpen(mockPeriodId);

      expect(result).toBe(false);
    });
  });

  describe('allowsChangeRequests', () => {
    it('should return true when change requests are allowed', async () => {
      const periodAllowingChanges = {
        ...mockPeriod,
        allowChangeRequests: true,
      };
      mockExecChain.exec.mockResolvedValue(periodAllowingChanges);
      mockModel.findById.mockReturnValue(mockExecChain);

      const result = await service.allowsChangeRequests(mockPeriodId);

      expect(result).toBe(true);
    });

    it('should return false when change requests are not allowed', async () => {
      const periodNotAllowingChanges = {
        ...mockPeriod,
        allowChangeRequests: false,
      };
      mockExecChain.exec.mockResolvedValue(periodNotAllowingChanges);
      mockModel.findById.mockReturnValue(mockExecChain);

      const result = await service.allowsChangeRequests(mockPeriodId);

      expect(result).toBe(false);
    });
  });
});
