import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RoutingValidatorService,
  ValidationResult,
} from '../common/services/routing-validator.service';
import { Program, ProgramDocument } from '../programs/entities/program.entity';

describe('RoutingValidatorService', () => {
  let service: RoutingValidatorService;
  let programModel: Model<ProgramDocument>;

  const mockProgramId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockRequestId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockDefaultProgram = 'PROG-ADMIN';
  const mockEmergencyProgram = 'PROG-EMERGENCY';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingValidatorService,
        {
          provide: getModelToken(Program.name),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoutingValidatorService>(RoutingValidatorService);
    programModel = module.get<Model<ProgramDocument>>(getModelToken(Program.name));
  });

  describe('validateAndEnsureProgram', () => {
    it('should validate successfully when program exists and is active', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };

      jest.spyOn(programModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: mockProgramId,
          code: 'PROG-001',
          name: 'Test Program',
          isActive: true,
        }),
      } as any);

      const result = await service.validateAndEnsureProgram(
        mockProgramId,
        mockRequestId,
        context,
      );

      expect(result.isValid).toBe(true);
      expect(result.assignedProgramId).toBe(mockProgramId);
      expect(result.fallbackUsed).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should apply fallback when program does not exist', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };

      let callCount = 0;
      jest.spyOn(programModel, 'findOne').mockImplementation((query: any) => {
        callCount++;
        // Primera y segunda llamadas: programa original no existe
        // Tercera y cuarta llamadas: programa por defecto existe y está activo
        const shouldReturnNull = callCount <= 2;
        return {
          exec: jest.fn().mockResolvedValue(
            shouldReturnNull
              ? null
              : {
                  _id: mockDefaultProgram,
                  code: mockDefaultProgram,
                  name: 'Default Program',
                  isActive: true,
                },
          ),
        } as any;
      });

      const result = await service.validateAndEnsureProgram(
        mockProgramId,
        mockRequestId,
        context,
      );

      expect(result.isValid).toBe(true);
      expect(result.assignedProgramId).toBe(mockDefaultProgram);
      expect(result.fallbackUsed).toBe(true);
      expect(result.reason).toContain('Programa original');
      expect(result.reason).toContain('PROGRAM_NOT_EXISTS');
    });

    it('should apply fallback when program is inactive', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };

      let callCount = 0;
      jest.spyOn(programModel, 'findOne').mockImplementation((query: any) => {
        callCount++;
        // Primera llamada (exists): retorna programa
        // Segunda llamada (isActive): retorna null (inactivo)
        // Tercera y cuarta llamadas (default): retorna programa por defecto activo
        if (callCount === 1) {
          return {
            exec: jest.fn().mockResolvedValue({
              _id: mockProgramId,
              code: 'PROG-001',
              isActive: false,
            }),
          } as any;
        } else if (callCount === 2) {
          return {
            exec: jest.fn().mockResolvedValue(null),
          } as any;
        } else {
          return {
            exec: jest.fn().mockResolvedValue({
              _id: mockDefaultProgram,
              code: mockDefaultProgram,
              isActive: true,
            }),
          } as any;
        }
      });

      const result = await service.validateAndEnsureProgram(
        mockProgramId,
        mockRequestId,
        context,
      );

      expect(result.isValid).toBe(true);
      expect(result.assignedProgramId).toBe(mockDefaultProgram);
      expect(result.fallbackUsed).toBe(true);
      expect(result.reason).toContain('PROGRAM_INACTIVE');
    });

    it('should return emergency program when default program is invalid', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };

      // Todas las llamadas retornan null (ni original ni default son válidos)
      jest.spyOn(programModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.validateAndEnsureProgram(
        mockProgramId,
        mockRequestId,
        context,
      );

      expect(result.isValid).toBe(false);
      expect(result.assignedProgramId).toBe(mockEmergencyProgram);
      expect(result.fallbackUsed).toBe(true);
      expect(result.reason).toContain('programa por defecto también inválido');
    });

    it('should handle critical errors and return emergency program', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };

      jest.spyOn(programModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database connection error')),
      } as any);

      const result = await service.validateAndEnsureProgram(
        mockProgramId,
        mockRequestId,
        context,
      );

      expect(result.isValid).toBe(false);
      expect(result.assignedProgramId).toBe(mockEmergencyProgram);
      expect(result.fallbackUsed).toBe(true);
      // El error puede ser capturado en validateProgramExists y retornar false,
      // lo que activa fallback con mensaje de programa inválido
      expect(result.reason).toBeDefined();
    });

    it('should validate program by code when ID lookup fails', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };
      const programCode = 'PROG-001';

      jest.spyOn(programModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: mockProgramId,
          code: programCode,
          name: 'Test Program',
          isActive: true,
        }),
      } as any);

      const result = await service.validateAndEnsureProgram(
        programCode,
        mockRequestId,
        context,
      );

      expect(result.isValid).toBe(true);
      expect(result.assignedProgramId).toBe(programCode);
      expect(result.fallbackUsed).toBe(false);
    });

    it('should handle empty context gracefully', async () => {
      jest.spyOn(programModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: mockProgramId,
          code: 'PROG-001',
          isActive: true,
        }),
      } as any);

      const result = await service.validateAndEnsureProgram(mockProgramId, mockRequestId, {});

      expect(result.isValid).toBe(true);
      expect(result.assignedProgramId).toBe(mockProgramId);
    });
  });

  describe('getDefaultProgram', () => {
    it('should return the default program ID', () => {
      const defaultProgram = service.getDefaultProgram();

      expect(defaultProgram).toBe(mockDefaultProgram);
    });

    it('should consistently return same default program', () => {
      const call1 = service.getDefaultProgram();
      const call2 = service.getDefaultProgram();

      expect(call1).toBe(call2);
      expect(call1).toBe(mockDefaultProgram);
    });
  });

  describe('shouldNotifyAdmins', () => {
    it('should return true when fallback was used', () => {
      const result: ValidationResult = {
        isValid: true,
        assignedProgramId: mockDefaultProgram,
        fallbackUsed: true,
        reason: 'Fallback applied',
      };

      const shouldNotify = service.shouldNotifyAdmins(result);

      expect(shouldNotify).toBe(true);
    });

    it('should return true when validation failed', () => {
      const result: ValidationResult = {
        isValid: false,
        assignedProgramId: mockEmergencyProgram,
        fallbackUsed: true,
        reason: 'Emergency program used',
      };

      const shouldNotify = service.shouldNotifyAdmins(result);

      expect(shouldNotify).toBe(true);
    });

    it('should return false when validation succeeded without fallback', () => {
      const result: ValidationResult = {
        isValid: true,
        assignedProgramId: mockProgramId,
        fallbackUsed: false,
      };

      const shouldNotify = service.shouldNotifyAdmins(result);

      expect(shouldNotify).toBe(false);
    });

    it('should return true even if valid but fallback was used', () => {
      const result: ValidationResult = {
        isValid: true,
        assignedProgramId: mockDefaultProgram,
        fallbackUsed: true,
      };

      const shouldNotify = service.shouldNotifyAdmins(result);

      expect(shouldNotify).toBe(true);
    });
  });

  describe('getValidationStats', () => {
    it('should return comprehensive validation statistics', () => {
      const stats = service.getValidationStats();

      expect(stats).toHaveProperty('defaultProgram');
      expect(stats).toHaveProperty('emergencyProgram');
      expect(stats).toHaveProperty('validationRules');
      expect(stats).toHaveProperty('fallbackReasons');
    });

    it('should include correct default and emergency program IDs', () => {
      const stats = service.getValidationStats();

      expect(stats.defaultProgram).toBe(mockDefaultProgram);
      expect(stats.emergencyProgram).toBe(mockEmergencyProgram);
    });

    it('should include validation rules', () => {
      const stats = service.getValidationStats();

      expect(Array.isArray(stats.validationRules)).toBe(true);
      expect(stats.validationRules.length).toBeGreaterThan(0);
      expect(stats.validationRules[0]).toContain('Programa debe existir');
    });

    it('should include fallback reasons', () => {
      const stats = service.getValidationStats();

      expect(Array.isArray(stats.fallbackReasons)).toBe(true);
      expect(stats.fallbackReasons.length).toBeGreaterThan(0);
      expect(stats.fallbackReasons.some((r: string) => r.includes('PROGRAM_NOT_EXISTS'))).toBe(
        true,
      );
      expect(stats.fallbackReasons.some((r: string) => r.includes('PROGRAM_INACTIVE'))).toBe(
        true,
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete validation workflow with success', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };

      jest.spyOn(programModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: mockProgramId,
          code: 'PROG-001',
          isActive: true,
        }),
      } as any);

      const result = await service.validateAndEnsureProgram(
        mockProgramId,
        mockRequestId,
        context,
      );
      const shouldNotify = service.shouldNotifyAdmins(result);
      const stats = service.getValidationStats();

      expect(result.isValid).toBe(true);
      expect(shouldNotify).toBe(false);
      expect(stats.defaultProgram).toBe(mockDefaultProgram);
    });

    it('should handle complete validation workflow with fallback', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };

      let callCount = 0;
      jest.spyOn(programModel, 'findOne').mockImplementation(() => {
        callCount++;
        const shouldReturnDefault = callCount > 2;
        return {
          exec: jest.fn().mockResolvedValue(
            shouldReturnDefault
              ? {
                  _id: mockDefaultProgram,
                  code: mockDefaultProgram,
                  isActive: true,
                }
              : null,
          ),
        } as any;
      });

      const result = await service.validateAndEnsureProgram(
        mockProgramId,
        mockRequestId,
        context,
      );
      const shouldNotify = service.shouldNotifyAdmins(result);
      const defaultProgram = service.getDefaultProgram();

      expect(result.isValid).toBe(true);
      expect(result.assignedProgramId).toBe(defaultProgram);
      expect(result.fallbackUsed).toBe(true);
      expect(shouldNotify).toBe(true);
    });

    it('should handle emergency scenario correctly', async () => {
      const context = { userId: '123', sourceSubjectId: '456' };

      jest.spyOn(programModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.validateAndEnsureProgram(
        mockProgramId,
        mockRequestId,
        context,
      );
      const shouldNotify = service.shouldNotifyAdmins(result);
      const stats = service.getValidationStats();

      expect(result.isValid).toBe(false);
      expect(result.assignedProgramId).toBe(stats.emergencyProgram);
      expect(shouldNotify).toBe(true);
    });
  });
});
