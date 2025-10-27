import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { ChangeRequestsService } from '../change-requests/services/change-requests.service';
import { ChangeRequest, ChangeRequestDocument } from '../change-requests/entities/change-request.entity';
import { CreateChangeRequestDto } from '../change-requests/dto/create-change-request.dto';
import { AuditService } from '../common/services/audit.service';
import { RadicadoService } from '../common/services/radicado.service';
import { PriorityCalculatorService, Priority } from '../common/services/priority-calculator.service';
import { RoutingService } from '../common/services/routing.service';
import { RoutingValidatorService } from '../common/services/routing-validator.service';

describe('ChangeRequestsService', () => {
  let service: ChangeRequestsService;
  let changeRequestModel: Model<ChangeRequestDocument>;
  let auditService: AuditService;
  let radicadoService: RadicadoService;
  let priorityCalculatorService: PriorityCalculatorService;
  let routingService: RoutingService;
  let routingValidatorService: RoutingValidatorService;

  const mockUserId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockSourceSubjectId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockTargetSubjectId = '60d5ecb8b0a7c4b4b8b9b1a3';
  const mockProgramId = 'PROG-CS';
  const mockRadicado = '2024-001';
  const mockRequestId = '60d5ecb8b0a7c4b4b8b9b1a4';

  const mockCreateDto: CreateChangeRequestDto = {
    sourceSubjectId: mockSourceSubjectId,
    targetSubjectId: mockTargetSubjectId,
    sourceGroupId: 'group-001',
    targetGroupId: 'group-002',
    reason: 'Test reason',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeRequestsService,
        {
          provide: getModelToken(ChangeRequest.name),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logCreateEvent: jest.fn().mockResolvedValue({}),
            logRadicateEvent: jest.fn().mockResolvedValue({}),
            logRouteEvent: jest.fn().mockResolvedValue({}),
            logFallbackEvent: jest.fn().mockResolvedValue({}),
            logRouteAssignedEvent: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: RadicadoService,
          useValue: {
            generateRadicado: jest.fn().mockResolvedValue(mockRadicado),
          },
        },
        {
          provide: PriorityCalculatorService,
          useValue: {
            calculatePriority: jest.fn().mockReturnValue(Priority.NORMAL),
            isAddDropPeriod: jest.fn().mockReturnValue(false),
            getPriorityDescription: jest.fn().mockReturnValue('Normal priority'),
            getPriorityWeight: jest.fn().mockReturnValue(2),
          },
        },
        {
          provide: RoutingService,
          useValue: {
            determineProgram: jest.fn().mockResolvedValue({
              assignedProgramId: mockProgramId,
              reason: 'Same program',
              rule: 'SAME_PROGRAM',
            }),
          },
        },
        {
          provide: RoutingValidatorService,
          useValue: {
            validateAndEnsureProgram: jest.fn().mockResolvedValue({
              isValid: true,
              assignedProgramId: mockProgramId,
              fallbackUsed: false,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ChangeRequestsService>(ChangeRequestsService);
    changeRequestModel = module.get<Model<ChangeRequestDocument>>(
      getModelToken(ChangeRequest.name),
    );
    auditService = module.get<AuditService>(AuditService);
    radicadoService = module.get<RadicadoService>(RadicadoService);
    priorityCalculatorService = module.get<PriorityCalculatorService>(
      PriorityCalculatorService,
    );
    routingService = module.get<RoutingService>(RoutingService);
    routingValidatorService = module.get<RoutingValidatorService>(
      RoutingValidatorService,
    );
  });

  describe('create', () => {
    it('should throw error when source equals target', async () => {
      const invalidDto: CreateChangeRequestDto = {
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockSourceSubjectId,
        sourceGroupId: 'group-001',
        targetGroupId: 'group-001',
        reason: 'Test',
      };

      await expect(service.create(invalidDto, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto, mockUserId)).rejects.toThrow(
        'La materia origen no puede ser igual a la materia destino',
      );
    });

    it('should return existing request if duplicate found', async () => {
      const existingRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        status: 'PENDING',
        radicado: mockRadicado,
      };

      jest.spyOn(changeRequestModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingRequest),
      } as any);

      // También mockear el findOne directo para que retorne el request existente
      (changeRequestModel.findOne as jest.Mock).mockResolvedValue(existingRequest);

      const result = await service.create(mockCreateDto, mockUserId);

      expect(result).toEqual(existingRequest);
      expect(radicadoService.generateRadicado).not.toHaveBeenCalled();
    });

    it('should create new change request successfully', async () => {
      const savedRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        ...mockCreateDto,
        status: 'PENDING',
        priority: Priority.NORMAL,
        assignedProgramId: mockProgramId,
        radicado: mockRadicado,
      };

      jest.spyOn(changeRequestModel, 'findOne').mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(savedRequest);
      const mockConstructor = jest.fn().mockImplementation((data: any) => ({
        ...data,
        save: mockSave,
      }));

      // Reemplazar temporalmente el constructor del modelo
      const originalModel = (service as any).changeRequestModel;
      (service as any).changeRequestModel = mockConstructor as any;
      Object.assign((service as any).changeRequestModel, {
        findOne: originalModel.findOne,
        find: originalModel.find,
        findById: originalModel.findById,
      });

      const result = await service.create(mockCreateDto, mockUserId);

      expect(radicadoService.generateRadicado).toHaveBeenCalled();
      expect(priorityCalculatorService.calculatePriority).toHaveBeenCalled();
      expect(routingService.determineProgram).toHaveBeenCalled();
      expect(routingValidatorService.validateAndEnsureProgram).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();

      // Restaurar
      (service as any).changeRequestModel = originalModel;
    });

    it('should log all audit events for new request', async () => {
      const savedRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        ...mockCreateDto,
        status: 'PENDING',
        priority: Priority.NORMAL,
        assignedProgramId: mockProgramId,
        radicado: mockRadicado,
      };

      jest.spyOn(changeRequestModel, 'findOne').mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(savedRequest);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        ...savedRequest,
        save: mockSave,
      }));

      const originalModel = (service as any).changeRequestModel;
      (service as any).changeRequestModel = mockConstructor as any;
      Object.assign((service as any).changeRequestModel, {
        findOne: originalModel.findOne,
        find: originalModel.find,
        findById: originalModel.findById,
      });

      await service.create(mockCreateDto, mockUserId);

      expect(auditService.logCreateEvent).toHaveBeenCalled();
      expect(auditService.logRadicateEvent).toHaveBeenCalled();
      expect(auditService.logRouteEvent).toHaveBeenCalled();
      expect(auditService.logRouteAssignedEvent).toHaveBeenCalled();

      (service as any).changeRequestModel = originalModel;
    });

    it('should log fallback event when fallback is used', async () => {
      const savedRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        ...mockCreateDto,
        status: 'PENDING',
        priority: Priority.NORMAL,
        assignedProgramId: 'PROG-ADMIN',
        radicado: mockRadicado,
      };

      jest.spyOn(changeRequestModel, 'findOne').mockResolvedValue(null);

      jest.spyOn(routingValidatorService, 'validateAndEnsureProgram').mockResolvedValue({
        isValid: true,
        assignedProgramId: 'PROG-ADMIN',
        fallbackUsed: true,
        reason: 'Original program inactive',
      });

      const mockSave = jest.fn().mockResolvedValue(savedRequest);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        ...savedRequest,
        save: mockSave,
      }));

      const originalModel = (service as any).changeRequestModel;
      (service as any).changeRequestModel = mockConstructor as any;
      Object.assign((service as any).changeRequestModel, {
        findOne: originalModel.findOne,
        find: originalModel.find,
        findById: originalModel.findById,
      });

      await service.create(mockCreateDto, mockUserId);

      expect(auditService.logFallbackEvent).toHaveBeenCalled();

      (service as any).changeRequestModel = originalModel;
    });

    it('should include ipAddress and userAgent in audit', async () => {
      const savedRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        ...mockCreateDto,
        status: 'PENDING',
        priority: Priority.NORMAL,
        assignedProgramId: mockProgramId,
        radicado: mockRadicado,
      };

      jest.spyOn(changeRequestModel, 'findOne').mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(savedRequest);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        ...savedRequest,
        save: mockSave,
      }));

      const originalModel = (service as any).changeRequestModel;
      (service as any).changeRequestModel = mockConstructor as any;
      Object.assign((service as any).changeRequestModel, {
        findOne: originalModel.findOne,
        find: originalModel.find,
        findById: originalModel.findById,
      });

      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      await service.create(mockCreateDto, mockUserId, ipAddress, userAgent);

      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        expect.any(String),
        mockUserId,
        expect.any(Object),
        ipAddress,
        userAgent,
      );

      (service as any).changeRequestModel = originalModel;
    });
  });

  describe('findByUser', () => {
    it('should return user requests sorted by date', async () => {
      const mockRequests = [
        { _id: '1', userId: mockUserId, createdAt: new Date('2024-01-02') },
        { _id: '2', userId: mockUserId, createdAt: new Date('2024-01-01') },
      ];

      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequests),
      });

      jest.spyOn(changeRequestModel, 'find').mockReturnValue({
        sort: mockSort,
      } as any);

      const result = await service.findByUser(mockUserId);

      expect(changeRequestModel.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('findOne', () => {
    it('should return request by ID', async () => {
      const mockRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        status: 'PENDING',
      };

      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(mockRequest as any);

      const result = await service.findOne(mockRequestId);

      expect(result).toEqual(mockRequest);
    });

    it('should throw error if request not found', async () => {
      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(BadRequestException);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Solicitud no encontrada',
      );
    });
  });

  describe('getRequestsByFaculty', () => {
    it('should get requests by faculty with filters', async () => {
      const mockRequests = [{ _id: '1', assignedProgramId: mockProgramId }];
      const filters = { status: 'PENDING', studentId: mockUserId };

      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequests),
      });

      jest.spyOn(changeRequestModel, 'find').mockReturnValue({
        sort: mockSort,
      } as any);

      const result = await service.getRequestsByFaculty(mockProgramId, filters);

      expect(changeRequestModel.find).toHaveBeenCalledWith({
        assignedProgramId: mockProgramId,
        status: 'PENDING',
        userId: mockUserId,
      });
      expect(result).toEqual(mockRequests);
    });

    it('should work without filters', async () => {
      const mockRequests = [{ _id: '1', assignedProgramId: mockProgramId }];

      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequests),
      });

      jest.spyOn(changeRequestModel, 'find').mockReturnValue({
        sort: mockSort,
      } as any);

      const result = await service.getRequestsByFaculty(mockProgramId, {});

      expect(changeRequestModel.find).toHaveBeenCalledWith({
        assignedProgramId: mockProgramId,
      });
    });
  });

  describe('getRequestDetails', () => {
    it('should return request details', async () => {
      const mockRequest = { _id: mockRequestId, userId: mockUserId };

      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(mockRequest as any);

      const result = await service.getRequestDetails(mockRequestId);

      expect(result).toEqual(mockRequest);
    });
  });

  describe('approveChangeRequest', () => {
    it('should approve pending request', async () => {
      const mockRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        status: 'PENDING',
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve({ ...this, status: 'APPROVED' });
        }),
      };

      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(mockRequest as any);

      const result = await service.approveChangeRequest(mockRequestId, {});

      expect(mockRequest.status).toBe('APPROVED');
      expect(mockRequest.save).toHaveBeenCalled();
    });

    it('should add observations when approving', async () => {
      const mockRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        status: 'PENDING',
        observations: undefined,
        save: jest.fn().mockResolvedValue(this),
      };

      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(mockRequest as any);

      await service.approveChangeRequest(mockRequestId, {
        observations: 'Approved with conditions',
      });

      expect(mockRequest.observations).toBe('Approved with conditions');
    });

    it('should throw error if request not pending', async () => {
      const mockRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        status: 'APPROVED',
      };

      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(mockRequest as any);

      await expect(
        service.approveChangeRequest(mockRequestId, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectChangeRequest', () => {
    it('should reject pending request', async () => {
      const mockRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        status: 'PENDING',
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve({ ...this, status: 'REJECTED' });
        }),
      };

      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(mockRequest as any);

      const result = await service.rejectChangeRequest(mockRequestId, {});

      expect(mockRequest.status).toBe('REJECTED');
      expect(mockRequest.save).toHaveBeenCalled();
    });

    it('should add observations when rejecting', async () => {
      const mockRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        status: 'PENDING',
        observations: undefined,
        save: jest.fn().mockResolvedValue(this),
      };

      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(mockRequest as any);

      await service.rejectChangeRequest(mockRequestId, {
        observations: 'Rejected due to conflicts',
      });

      expect(mockRequest.observations).toBe('Rejected due to conflicts');
    });

    it('should throw error if request not pending', async () => {
      const mockRequest = {
        _id: mockRequestId,
        userId: mockUserId,
        status: 'REJECTED',
      };

      jest.spyOn(changeRequestModel, 'findById').mockResolvedValue(mockRequest as any);

      await expect(
        service.rejectChangeRequest(mockRequestId, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
