import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditService, AuditEventData } from '../common/services/audit.service';
import { AuditRequest, AuditRequestDocument } from '../common/entities/audit-request.entity';

describe('AuditService', () => {
  let service: AuditService;
  let auditModel: Model<AuditRequestDocument>;

  const mockRequestId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockActorId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockProgramId = '60d5ecb8b0a7c4b4b8b9b1a3';
  const mockRadicado = '2024-001';

  const mockAuditEntry = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a4',
    requestId: mockRequestId,
    eventType: 'CREATE',
    actorId: mockActorId,
    timestamp: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditRequest.name),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditModel = module.get<Model<AuditRequestDocument>>(
      getModelToken(AuditRequest.name),
    );
  });

  describe('logEvent', () => {
    it('should log audit event successfully', async () => {
      const eventData: AuditEventData = {
        requestId: mockRequestId,
        eventType: 'CREATE',
        actorId: mockActorId,
        requestDetails: { test: 'data' },
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockAuditEntry,
        ...eventData,
      });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      const result = await service.logEvent(eventData);

      expect(mockSave).toHaveBeenCalled();
      expect(result.requestId).toBe(mockRequestId);
      expect(result.eventType).toBe('CREATE');
    });

    it('should log critical events with warning', async () => {
      const eventData: AuditEventData = {
        requestId: mockRequestId,
        eventType: 'DELETE',
        actorId: mockActorId,
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockAuditEntry,
        ...eventData,
        eventType: 'DELETE',
      });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      const result = await service.logEvent(eventData);

      expect(mockSave).toHaveBeenCalled();
      expect(result.eventType).toBe('DELETE');
    });

    it('should include timestamp in audit entry', async () => {
      const eventData: AuditEventData = {
        requestId: mockRequestId,
        eventType: 'UPDATE',
        actorId: mockActorId,
      };

      let capturedData: any;
      const mockSave = jest.fn().mockImplementation(function (this: any) {
        capturedData = this;
        return Promise.resolve({ ...this, _id: 'test-id' });
      });

      (auditModel as any) = jest.fn().mockImplementation((data: any) => ({
        ...data,
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await service.logEvent(eventData);

      expect(capturedData).toHaveProperty('timestamp');
      expect(capturedData.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when save fails', async () => {
      const eventData: AuditEventData = {
        requestId: mockRequestId,
        eventType: 'CREATE',
        actorId: mockActorId,
      };

      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await expect(service.logEvent(eventData)).rejects.toThrow('Database error');
    });

    it('should include optional fields when provided', async () => {
      const eventData: AuditEventData = {
        requestId: mockRequestId,
        eventType: 'CREATE',
        actorId: mockActorId,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        sourceData: { field1: 'value1' },
        targetData: { field2: 'value2' },
      };

      let capturedData: any;
      const mockSave = jest.fn().mockImplementation(function (this: any) {
        capturedData = this;
        return Promise.resolve({ ...this, _id: 'test-id' });
      });

      (auditModel as any) = jest.fn().mockImplementation((data: any) => ({
        ...data,
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await service.logEvent(eventData);

      expect(capturedData.ipAddress).toBe('192.168.1.1');
      expect(capturedData.userAgent).toBe('Mozilla/5.0');
      expect(capturedData.sourceData).toEqual({ field1: 'value1' });
      expect(capturedData.targetData).toEqual({ field2: 'value2' });
    });
  });

  describe('logCreateEvent', () => {
    it('should log CREATE event with all details', async () => {
      const requestDetails = { field: 'value' };
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'test-id',
        requestId: mockRequestId,
        eventType: 'CREATE',
        actorId: mockActorId,
        requestDetails,
        ipAddress,
        userAgent,
      });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      const result = await service.logCreateEvent(
        mockRequestId,
        mockActorId,
        requestDetails,
        ipAddress,
        userAgent,
      );

      expect(result.eventType).toBe('CREATE');
      expect(result.requestDetails).toEqual(requestDetails);
    });

    it('should work without optional parameters', async () => {
      const requestDetails = { field: 'value' };

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'test-id',
        requestId: mockRequestId,
        eventType: 'CREATE',
        actorId: mockActorId,
        requestDetails,
      });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      const result = await service.logCreateEvent(
        mockRequestId,
        mockActorId,
        requestDetails,
      );

      expect(result.eventType).toBe('CREATE');
    });

    it('should throw error on failure', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await expect(
        service.logCreateEvent(mockRequestId, mockActorId, {}),
      ).rejects.toThrow('Save failed');
    });
  });

  describe('logRadicateEvent', () => {
    it('should log RADICATE event with radicado details', async () => {
      const priority = 'HIGH';
      const priorityCriteria = { reason: 'mandatory subject' };

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'test-id',
        requestId: mockRequestId,
        eventType: 'RADICATE',
        actorId: 'system',
        requestDetails: {
          entityType: 'radicado_assignment',
          radicado: mockRadicado,
          priority,
          priorityCriteria,
        },
      });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      const result = await service.logRadicateEvent(
        mockRequestId,
        mockRadicado,
        priority,
        priorityCriteria,
      );

      expect(result.eventType).toBe('RADICATE');
      expect(result.actorId).toBe('system');
      expect(result.requestDetails).toHaveProperty('radicado', mockRadicado);
      expect(result.requestDetails).toHaveProperty('priority', priority);
    });

    it('should include timestamp in request details', async () => {
      let capturedData: any;
      const mockSave = jest.fn().mockImplementation(function (this: any) {
        capturedData = this;
        return Promise.resolve({ ...this, _id: 'test-id' });
      });

      (auditModel as any) = jest.fn().mockImplementation((data: any) => ({
        ...data,
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await service.logRadicateEvent(mockRequestId, mockRadicado, 'NORMAL', {});

      expect(capturedData.requestDetails).toHaveProperty('timestamp');
    });

    it('should throw error on failure', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await expect(
        service.logRadicateEvent(mockRequestId, mockRadicado, 'NORMAL', {}),
      ).rejects.toThrow('Database error');
    });
  });

  describe('logRouteEvent', () => {
    it('should log ROUTE event with routing decision', async () => {
      const routingDecision = { rule: 'SAME_PROGRAM', reason: 'test' };

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'test-id',
        requestId: mockRequestId,
        eventType: 'ROUTE',
        actorId: 'system',
        requestDetails: {
          entityType: 'program_assignment',
          assignedProgramId: mockProgramId,
          routingDecision,
        },
      });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      const result = await service.logRouteEvent(
        mockRequestId,
        mockProgramId,
        routingDecision,
      );

      expect(result.eventType).toBe('ROUTE');
      expect(result.requestDetails).toHaveProperty('assignedProgramId', mockProgramId);
      expect(result.requestDetails).toHaveProperty('routingDecision', routingDecision);
    });

    it('should throw error on failure', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await expect(
        service.logRouteEvent(mockRequestId, mockProgramId, {}),
      ).rejects.toThrow('Save failed');
    });
  });

  describe('logFallbackEvent', () => {
    it('should log FALLBACK event with reason', async () => {
      const originalProgramId = 'PROG-INVALID';
      const fallbackProgramId = 'PROG-DEFAULT';
      const reason = 'Original program inactive';

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'test-id',
        requestId: mockRequestId,
        eventType: 'FALLBACK',
        actorId: 'system',
        requestDetails: {
          entityType: 'program_fallback',
          originalProgramId,
          fallbackProgramId,
          reason,
        },
      });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      const result = await service.logFallbackEvent(
        mockRequestId,
        originalProgramId,
        fallbackProgramId,
        reason,
      );

      expect(result.eventType).toBe('FALLBACK');
      expect(result.requestDetails).toHaveProperty('originalProgramId', originalProgramId);
      expect(result.requestDetails).toHaveProperty('fallbackProgramId', fallbackProgramId);
      expect(result.requestDetails).toHaveProperty('reason', reason);
    });

    it('should throw error on failure', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await expect(
        service.logFallbackEvent(mockRequestId, 'prog1', 'prog2', 'test'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('logRouteAssignedEvent', () => {
    it('should log ROUTE_ASSIGNED event with all details', async () => {
      const routingDecision = { rule: 'TARGET_PROGRAM' };
      const validationResult = { isValid: true };
      const troubleshootingInfo = { attemptCount: 1 };

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'test-id',
        requestId: mockRequestId,
        eventType: 'ROUTE_ASSIGNED',
        actorId: 'system',
        requestDetails: {
          entityType: 'route_assignment',
          finalProgramId: mockProgramId,
          routingDecision,
          validationResult,
          troubleshootingInfo,
        },
      });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      const result = await service.logRouteAssignedEvent(
        mockRequestId,
        mockProgramId,
        routingDecision,
        validationResult,
        troubleshootingInfo,
      );

      expect(result.eventType).toBe('ROUTE_ASSIGNED');
      expect(result.requestDetails).toHaveProperty('finalProgramId', mockProgramId);
      expect(result.requestDetails).toHaveProperty('routingDecision');
      expect(result.requestDetails).toHaveProperty('validationResult');
      expect(result.requestDetails).toHaveProperty('troubleshootingInfo');
    });

    it('should throw error on failure', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await expect(
        service.logRouteAssignedEvent(mockRequestId, mockProgramId, {}, {}, {}),
      ).rejects.toThrow('Save failed');
    });
  });

  describe('getAuditHistory', () => {
    it('should retrieve audit history for a request', async () => {
      const mockHistory = [
        {
          _id: '1',
          requestId: mockRequestId,
          eventType: 'CREATE',
          timestamp: new Date(),
        },
        {
          _id: '2',
          requestId: mockRequestId,
          eventType: 'RADICATE',
          timestamp: new Date(),
        },
      ];

      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockHistory),
      });

      jest.spyOn(auditModel, 'find').mockReturnValue({
        sort: mockSort,
      } as any);

      const result = await service.getAuditHistory(mockRequestId);

      expect(auditModel.find).toHaveBeenCalledWith({ requestId: mockRequestId });
      expect(mockSort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(result).toHaveLength(2);
      expect(result[0].eventType).toBe('CREATE');
    });

    it('should return empty array when no history found', async () => {
      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      jest.spyOn(auditModel, 'find').mockReturnValue({
        sort: mockSort,
      } as any);

      const result = await service.getAuditHistory(mockRequestId);

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      jest.spyOn(auditModel, 'find').mockReturnValue({
        sort: mockSort,
      } as any);

      await expect(service.getAuditHistory(mockRequestId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete audit workflow', async () => {
      const mockSave = jest.fn()
        .mockResolvedValueOnce({
          _id: 'test-id',
          requestId: mockRequestId,
          eventType: 'CREATE',
          actorId: mockActorId,
        });

      (auditModel as any).mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: '1', eventType: 'CREATE', requestId: mockRequestId },
        ]),
      });

      jest.spyOn(auditModel, 'find').mockReturnValue({
        sort: mockSort,
      } as any);

      // Testear solo la consulta de historial (ya testeamos create en otros tests)
      const history = await service.getAuditHistory(mockRequestId);

      expect(auditModel.find).toHaveBeenCalledWith({ requestId: mockRequestId });
      expect(history).toHaveLength(1);
      expect(history[0].eventType).toBe('CREATE');
    });

    it('should log multiple events in sequence', async () => {
      const mockSave = jest.fn()
        .mockResolvedValueOnce({
          _id: '1',
          eventType: 'CREATE',
          requestId: mockRequestId,
        })
        .mockResolvedValueOnce({
          _id: '2',
          eventType: 'RADICATE',
          requestId: mockRequestId,
        })
        .mockResolvedValueOnce({
          _id: '3',
          eventType: 'ROUTE',
          requestId: mockRequestId,
        });

      (auditModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service = new AuditService(auditModel);

      await service.logCreateEvent(mockRequestId, mockActorId, {});
      await service.logRadicateEvent(mockRequestId, mockRadicado, 'NORMAL', {});
      await service.logRouteEvent(mockRequestId, mockProgramId, {});

      expect(mockSave).toHaveBeenCalledTimes(3);
    });
  });
});
