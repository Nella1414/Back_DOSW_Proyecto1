import { Test, TestingModule } from '@nestjs/testing';
import { AcademicPeriodsController } from '../academic-periods/academic-periods.controller';
import { AcademicPeriodsService } from '../academic-periods/services/academic-periods.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AcademicPeriodsController', () => {
  let controller: AcademicPeriodsController;
  let service: jest.Mocked<AcademicPeriodsService>;

  const mockAcademicPeriod = {
    _id: 'period123',
    code: '2024-2',
    name: 'Segundo Semestre 2024',
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-12-15'),
    isActive: false,
    allowChangeRequests: true,
    isEnrollmentOpen: true,
    status: 'ACTIVE',
  };

  const mockCreateDto = {
    code: '2024-2',
    name: 'Segundo Semestre 2024',
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-12-15'),
    isActive: false,
    allowChangeRequests: true,
    isEnrollmentOpen: true,
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllWithFilters: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      setActivePeriod: jest.fn(),
      getActivePeriod: jest.fn(),
      getPeriodsAllowingChanges: jest.fn(),
      getPeriodsWithOpenEnrollment: jest.fn(),
      isEnrollmentOpen: jest.fn(),
      allowsChangeRequests: jest.fn(),
      validatePeriodDates: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicPeriodsController],
      providers: [
        {
          provide: AcademicPeriodsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AcademicPeriodsController>(
      AcademicPeriodsController,
    );
    service = module.get(AcademicPeriodsService);
  });

  describe('create', () => {
    it('should create a new academic period successfully', async () => {
      // Arrange
      service.validatePeriodDates.mockResolvedValue(undefined);
      service.create.mockResolvedValue(mockAcademicPeriod as any);

      // Act
      const result = await controller.create(mockCreateDto);

      // Assert
      expect(service.validatePeriodDates).toHaveBeenCalledWith(
        mockCreateDto.startDate,
        mockCreateDto.endDate,
      );
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockAcademicPeriod);
    });

    it('should throw conflict exception for overlapping dates', async () => {
      // Arrange
      service.validatePeriodDates.mockRejectedValue(
        new ConflictException(
          'Academic period dates overlap with existing periods',
        ),
      );

      // Act & Assert
      await expect(controller.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw conflict exception for duplicate code', async () => {
      // Arrange
      service.validatePeriodDates.mockResolvedValue(undefined);
      service.create.mockRejectedValue(
        new ConflictException('Academic period code already exists'),
      );

      // Act & Assert
      await expect(controller.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all periods without filters', async () => {
      // Arrange
      const mockPeriods = [mockAcademicPeriod];
      service.findAll.mockResolvedValue(mockPeriods as any);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPeriods);
    });

    it('should return paginated periods with filters', async () => {
      // Arrange
      const mockPaginatedResult = {
        periods: [mockAcademicPeriod],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      service.findAllWithFilters.mockResolvedValue(mockPaginatedResult as any);

      // Act
      const result = await controller.findAll('1', '10', 'ACTIVE', '2024');

      // Assert
      expect(service.findAllWithFilters).toHaveBeenCalledWith(
        1,
        10,
        'ACTIVE',
        2024,
      );
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return specific academic period', async () => {
      // Arrange
      service.findOne.mockResolvedValue(mockAcademicPeriod as any);

      // Act
      const result = await controller.findOne('period123');

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('period123');
      expect(result).toEqual(mockAcademicPeriod);
    });

    it('should throw not found exception for non-existent period', async () => {
      // Arrange
      service.findOne.mockRejectedValue(
        new NotFoundException('Academic period with ID period123 not found'),
      );

      // Act & Assert
      await expect(controller.findOne('period123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Name' };

    it('should update academic period successfully', async () => {
      // Arrange
      const updatedPeriod = { ...mockAcademicPeriod, ...updateDto };
      service.update.mockResolvedValue(updatedPeriod as any);

      // Act
      const result = await controller.update('period123', updateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith('period123', updateDto);
      expect(result).toEqual(updatedPeriod);
    });

    it('should validate dates when updating period', async () => {
      // Arrange
      const updateDtoWithDates = {
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-12-31'),
      };
      service.validatePeriodDates.mockResolvedValue(undefined);
      service.update.mockResolvedValue(mockAcademicPeriod as any);

      // Act
      await controller.update('period123', updateDtoWithDates);

      // Assert
      expect(service.validatePeriodDates).toHaveBeenCalledWith(
        updateDtoWithDates.startDate,
        updateDtoWithDates.endDate,
        'period123',
      );
    });
  });

  describe('setActivePeriod', () => {
    it('should activate academic period successfully', async () => {
      // Arrange
      const activatedPeriod = { ...mockAcademicPeriod, isActive: true };
      service.setActivePeriod.mockResolvedValue(activatedPeriod as any);

      // Act
      const result = await controller.setActivePeriod('period123');

      // Assert
      expect(service.setActivePeriod).toHaveBeenCalledWith('period123');
      expect(result).toEqual(activatedPeriod);
    });
  });

  describe('remove', () => {
    it('should delete academic period successfully', async () => {
      // Arrange
      service.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove('period123');

      // Assert
      expect(service.remove).toHaveBeenCalledWith('period123');
    });

    it('should throw conflict exception for period with associated data', async () => {
      // Arrange
      service.remove.mockRejectedValue(
        new ConflictException(
          'Cannot delete academic period with associated enrollments or course groups',
        ),
      );

      // Act & Assert
      await expect(controller.remove('period123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getActivePeriod', () => {
    it('should return active period', async () => {
      // Arrange
      const activePeriod = { ...mockAcademicPeriod, isActive: true };
      service.getActivePeriod.mockResolvedValue(activePeriod as any);

      // Act
      const result = await controller.getActivePeriod();

      // Assert
      expect(service.getActivePeriod).toHaveBeenCalled();
      expect(result).toEqual(activePeriod);
    });

    it('should return null when no active period', async () => {
      // Arrange
      service.getActivePeriod.mockResolvedValue(null);

      // Act
      const result = await controller.getActivePeriod();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getPeriodsAllowingChanges', () => {
    it('should return periods that allow change requests', async () => {
      // Arrange
      const periods = [mockAcademicPeriod];
      service.getPeriodsAllowingChanges.mockResolvedValue(periods as any);

      // Act
      const result = await controller.getPeriodsAllowingChanges();

      // Assert
      expect(service.getPeriodsAllowingChanges).toHaveBeenCalled();
      expect(result).toEqual(periods);
    });
  });

  describe('getPeriodsWithOpenEnrollment', () => {
    it('should return periods with open enrollment', async () => {
      // Arrange
      const periods = [mockAcademicPeriod];
      service.getPeriodsWithOpenEnrollment.mockResolvedValue(periods as any);

      // Act
      const result = await controller.getPeriodsWithOpenEnrollment();

      // Assert
      expect(service.getPeriodsWithOpenEnrollment).toHaveBeenCalled();
      expect(result).toEqual(periods);
    });
  });

  describe('checkEnrollmentStatus', () => {
    it('should return enrollment status', async () => {
      // Arrange
      service.isEnrollmentOpen.mockResolvedValue(true);

      // Act
      const result = await controller.checkEnrollmentStatus('period123');

      // Assert
      expect(service.isEnrollmentOpen).toHaveBeenCalledWith('period123');
      expect(result).toEqual({ enrollmentOpen: true });
    });
  });

  describe('checkChangeRequestsStatus', () => {
    it('should return change requests status', async () => {
      // Arrange
      service.allowsChangeRequests.mockResolvedValue(true);

      // Act
      const result = await controller.checkChangeRequestsStatus('period123');

      // Assert
      expect(service.allowsChangeRequests).toHaveBeenCalledWith('period123');
      expect(result).toEqual({ changeRequestsAllowed: true });
    });
  });
});
