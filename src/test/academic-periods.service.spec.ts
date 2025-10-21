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
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    new: jest.fn(),
    constructor: jest.fn(),
  } as any;

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

  describe('create', () => {
    it('should verify no existing period before creating', async () => {
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

      // Mock findOne to return something (existing period)
      mockModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockPeriod),
      });

      // Should throw because period already exists
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockModel.findOne).toHaveBeenCalledWith({ code: '2025-1' });
    });

    it('should throw ConflictException when period code already exists', async () => {
      const createDto: CreateAcademicPeriodDto = {
        code: '2024-2',
        name: 'Segundo Semestre 2024',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-12-15'),
        status: 'ACTIVE',
        isActive: false,
        allowChangeRequests: true,
        isEnrollmentOpen: true,
      };

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPeriod),
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when start date is after end date', async () => {
      const createDto: CreateAcademicPeriodDto = {
        code: '2025-1',
        name: 'Primer Semestre 2025',
        startDate: new Date('2025-06-15'),
        endDate: new Date('2025-01-15'),
        status: 'ACTIVE',
        isActive: false,
        allowChangeRequests: true,
        isEnrollmentOpen: true,
      };

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update an academic period successfully', async () => {
      const updateDto: UpdateAcademicPeriodDto = {
        name: 'Updated Period Name',
        allowChangeRequests: false,
      };

      const updatedPeriod = { ...mockPeriod, ...updateDto };
      mockExecChain.exec.mockResolvedValue(updatedPeriod);
      mockModel.findByIdAndUpdate.mockReturnValue(mockExecChain);

      const result = await service.update(mockPeriodId, updateDto);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPeriodId,
        updateDto,
        { new: true }
      );
      expect(result).toEqual(updatedPeriod);
    });

    it('should throw NotFoundException when period to update is not found', async () => {
      const updateDto: UpdateAcademicPeriodDto = {
        name: 'Updated Period Name',
      };

      mockExecChain.exec.mockResolvedValue(null);
      mockModel.findByIdAndUpdate.mockReturnValue(mockExecChain);

      await expect(service.update('nonexistent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when updating with invalid dates', async () => {
      const updateDto: UpdateAcademicPeriodDto = {
        startDate: new Date('2025-06-15'),
        endDate: new Date('2025-01-15'),
      };

      await expect(service.update(mockPeriodId, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('setActivePeriod', () => {
    it('should activate a period and deactivate all others', async () => {
      mockModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const activatedPeriod = { ...mockPeriod, isActive: true };
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(activatedPeriod),
      });

      const result = await service.setActivePeriod(mockPeriodId);

      expect(mockModel.updateMany).toHaveBeenCalledWith({}, { isActive: false });
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPeriodId,
        { isActive: true },
        { new: true }
      );
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when period to activate is not found', async () => {
      mockModel.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.setActivePeriod('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an academic period successfully', async () => {
      mockExecChain.exec.mockResolvedValue(mockPeriod);
      mockModel.findById.mockReturnValue(mockExecChain);
      mockModel.findByIdAndDelete.mockReturnValue(mockExecChain);

      await service.remove(mockPeriodId);

      expect(mockModel.findById).toHaveBeenCalledWith(mockPeriodId);
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(mockPeriodId);
    });

    it('should throw NotFoundException when period to delete is not found', async () => {
      mockExecChain.exec.mockResolvedValue(null);
      mockModel.findById.mockReturnValue(mockExecChain);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validatePeriodDates', () => {
    it('should not throw error when dates do not overlap', async () => {
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      await expect(
        service.validatePeriodDates(
          new Date('2025-01-15'),
          new Date('2025-06-15')
        )
      ).resolves.not.toThrow();
    });

    it('should throw ConflictException when dates overlap with existing period', async () => {
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockPeriod]),
      });

      await expect(
        service.validatePeriodDates(
          new Date('2024-08-01'),
          new Date('2024-12-31')
        )
      ).rejects.toThrow(ConflictException);
    });

    it('should exclude period when excludeId is provided', async () => {
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      await expect(
        service.validatePeriodDates(
          new Date('2024-07-15'),
          new Date('2024-12-15'),
          mockPeriodId
        )
      ).resolves.not.toThrow();

      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: { $ne: mockPeriodId },
        })
      );
    });
  });

  describe('findAllWithFilters', () => {
    it('should return paginated periods without filters', async () => {
      const periods = [mockPeriod];

      const mockLimitChain = { exec: jest.fn().mockResolvedValue(periods) };
      const mockSkipChain = { limit: jest.fn().mockReturnValue(mockLimitChain) };
      const mockSortChainLocal = { skip: jest.fn().mockReturnValue(mockSkipChain) };
      const mockFindChain = { sort: jest.fn().mockReturnValue(mockSortChainLocal) };

      mockModel.find.mockReturnValue(mockFindChain);
      mockModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const result = await service.findAllWithFilters(1, 10);

      expect(result).toBeDefined();
      expect(result.periods).toEqual(periods);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status when provided', async () => {
      const periods = [mockPeriod];

      const mockLimitChain = { exec: jest.fn().mockResolvedValue(periods) };
      const mockSkipChain = { limit: jest.fn().mockReturnValue(mockLimitChain) };
      const mockSortChainLocal = { skip: jest.fn().mockReturnValue(mockSkipChain) };
      const mockFindChain = { sort: jest.fn().mockReturnValue(mockSortChainLocal) };

      mockModel.find.mockReturnValue(mockFindChain);
      mockModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      await service.findAllWithFilters(1, 10, 'ACTIVE');

      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' })
      );
    });

    it('should filter by year when provided', async () => {
      const periods = [mockPeriod];

      const mockLimitChain = { exec: jest.fn().mockResolvedValue(periods) };
      const mockSkipChain = { limit: jest.fn().mockReturnValue(mockLimitChain) };
      const mockSortChainLocal = { skip: jest.fn().mockReturnValue(mockSkipChain) };
      const mockFindChain = { sort: jest.fn().mockReturnValue(mockSortChainLocal) };

      mockModel.find.mockReturnValue(mockFindChain);
      mockModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      await service.findAllWithFilters(1, 10, undefined, 2024);

      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.objectContaining({
            $gte: expect.any(Date),
            $lt: expect.any(Date),
          }),
        })
      );
    });
  });
});
