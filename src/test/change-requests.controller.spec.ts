import { Test, TestingModule } from '@nestjs/testing';
import { ChangeRequestsController } from '../change-requests/change-requests.controller';
import { ChangeRequestsService } from '../change-requests/services/change-requests.service';
import { CreateChangeRequestDto } from '../change-requests/dto/create-change-request.dto';
import {
  ApproveChangeRequestDto,
  RejectChangeRequestDto,
} from '../change-requests/dto/change-request-response.dto';
import { RequestState } from '../change-requests/entities/change-request.entity';

describe('ChangeRequestsController', () => {
  let controller: ChangeRequestsController;
  let service: ChangeRequestsService;

  const mockChangeRequest = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a4',
    userId: 'user123',
    sourceSubjectId: 'subject001',
    targetSubjectId: 'subject002',
    sourceGroupId: 'group001',
    targetGroupId: 'group002',
    status: 'PENDING',
    radicado: '2024-001',
    priority: 'NORMAL',
    requestHash: 'hash123',
    createdAt: new Date(),
  };

  const mockRequest = {
    user: {
      id: 'user123',
      email: 'student@test.com',
    },
    ip: '192.168.1.1',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChangeRequestsController],
      providers: [
        {
          provide: ChangeRequestsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockChangeRequest),
            getRequestsByFaculty: jest.fn().mockResolvedValue([mockChangeRequest]),
            getRequestDetails: jest.fn().mockResolvedValue(mockChangeRequest),
            approveChangeRequest: jest
              .fn()
              .mockResolvedValue({ ...mockChangeRequest, status: 'APPROVED' }),
            rejectChangeRequest: jest
              .fn()
              .mockResolvedValue({ ...mockChangeRequest, status: 'REJECTED' }),
          },
        },
      ],
    }).compile();

    controller = module.get<ChangeRequestsController>(ChangeRequestsController);
    service = module.get<ChangeRequestsService>(ChangeRequestsService);
  });

  describe('createChangeRequest', () => {
    it('should create a change request', async () => {
      const createDto: CreateChangeRequestDto = {
        sourceSubjectId: 'subject001',
        targetSubjectId: 'subject002',
        sourceGroupId: 'group001',
        targetGroupId: 'group002',
        reason: 'Schedule conflict',
      };

      const result = await controller.createChangeRequest(mockRequest, createDto);

      expect(result).toEqual(mockChangeRequest);
      expect(service.create).toHaveBeenCalledWith(
        createDto,
        'user123',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should handle anonymous user', async () => {
      const anonymousRequest = {
        user: null,
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Mozilla/5.0' },
      };

      const createDto: CreateChangeRequestDto = {
        sourceSubjectId: 'subject001',
        targetSubjectId: 'subject002',
        sourceGroupId: 'group001',
        targetGroupId: 'group002',
        reason: 'Test',
      };

      await controller.createChangeRequest(anonymousRequest, createDto);

      expect(service.create).toHaveBeenCalledWith(
        createDto,
        'anonymous',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should extract ip and user-agent from request', async () => {
      const createDto: CreateChangeRequestDto = {
        sourceSubjectId: 'subject001',
        targetSubjectId: 'subject002',
        sourceGroupId: 'group001',
        targetGroupId: 'group002',
        reason: 'Test',
      };

      await controller.createChangeRequest(mockRequest, createDto);

      expect(service.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });
  });

  describe('getRequestsByFaculty', () => {
    it('should get requests by faculty with all filters', async () => {
      const facultyId = 'faculty123';
      const status = RequestState.PENDING;
      const periodId = 'period123';
      const studentId = 'student123';

      const result = await controller.getRequestsByFaculty(
        facultyId,
        status,
        periodId,
        studentId,
      );

      expect(result).toEqual([mockChangeRequest]);
      expect(service.getRequestsByFaculty).toHaveBeenCalledWith(facultyId, {
        status,
        periodId,
        studentId,
      });
    });

    it('should get requests by faculty without filters', async () => {
      const facultyId = 'faculty123';

      const result = await controller.getRequestsByFaculty(facultyId);

      expect(result).toEqual([mockChangeRequest]);
      expect(service.getRequestsByFaculty).toHaveBeenCalledWith(facultyId, {
        status: undefined,
        periodId: undefined,
        studentId: undefined,
      });
    });

    it('should get requests by faculty with only status filter', async () => {
      const facultyId = 'faculty123';
      const status = RequestState.APPROVED;

      const result = await controller.getRequestsByFaculty(facultyId, status);

      expect(result).toEqual([mockChangeRequest]);
      expect(service.getRequestsByFaculty).toHaveBeenCalledWith(facultyId, {
        status,
        periodId: undefined,
        studentId: undefined,
      });
    });

    it('should handle multiple request states', async () => {
      const facultyId = 'faculty123';

      await controller.getRequestsByFaculty(facultyId, RequestState.PENDING);
      await controller.getRequestsByFaculty(facultyId, RequestState.APPROVED);
      await controller.getRequestsByFaculty(facultyId, RequestState.REJECTED);

      expect(service.getRequestsByFaculty).toHaveBeenCalledTimes(3);
    });
  });

  describe('getRequestDetails', () => {
    it('should get request details by id', async () => {
      const requestId = '60d5ecb8b0a7c4b4b8b9b1a4';

      const result = await controller.getRequestDetails(requestId);

      expect(result).toEqual(mockChangeRequest);
      expect(service.getRequestDetails).toHaveBeenCalledWith(requestId);
    });

    it('should call service with correct id', async () => {
      const requestId = 'test-id-123';

      await controller.getRequestDetails(requestId);

      expect(service.getRequestDetails).toHaveBeenCalledWith(requestId);
      expect(service.getRequestDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('approveRequest', () => {
    it('should approve a change request', async () => {
      const requestId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const approveDto: ApproveChangeRequestDto = {
        observations: 'Approved by dean',
      };

      const result = await controller.approveRequest(requestId, approveDto);

      expect(result.status).toBe('APPROVED');
      expect(service.approveChangeRequest).toHaveBeenCalledWith(requestId, approveDto);
    });

    it('should approve without observations', async () => {
      const requestId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const approveDto: ApproveChangeRequestDto = {};

      await controller.approveRequest(requestId, approveDto);

      expect(service.approveChangeRequest).toHaveBeenCalledWith(requestId, approveDto);
    });

    it('should return approved request with updated status', async () => {
      const requestId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const approveDto: ApproveChangeRequestDto = {
        observations: 'Looks good',
      };

      const result = await controller.approveRequest(requestId, approveDto);

      expect(result).toHaveProperty('status', 'APPROVED');
      expect(result).toHaveProperty('_id', requestId);
    });
  });

  describe('rejectRequest', () => {
    it('should reject a change request', async () => {
      const requestId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const rejectDto: RejectChangeRequestDto = {
        resolutionReason: 'Does not meet requirements',
        observations: 'Additional notes',
      };

      const result = await controller.rejectRequest(requestId, rejectDto);

      expect(result.status).toBe('REJECTED');
      expect(service.rejectChangeRequest).toHaveBeenCalledWith(requestId, rejectDto);
    });

    it('should reject without observations', async () => {
      const requestId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const rejectDto: RejectChangeRequestDto = {
        resolutionReason: 'Policy violation',
      };

      await controller.rejectRequest(requestId, rejectDto);

      expect(service.rejectChangeRequest).toHaveBeenCalledWith(requestId, rejectDto);
    });

    it('should return rejected request with updated status', async () => {
      const requestId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const rejectDto: RejectChangeRequestDto = {
        resolutionReason: 'Conflicts with other enrollment',
        observations: 'Student already enrolled',
      };

      const result = await controller.rejectRequest(requestId, rejectDto);

      expect(result).toHaveProperty('status', 'REJECTED');
      expect(result).toHaveProperty('_id', requestId);
    });
  });

  describe('getMyRequests', () => {
    it('should return placeholder message', async () => {
      const result = await controller.getMyRequests(mockRequest);

      expect(result).toHaveProperty('message', 'Feature coming soon');
      expect(result).toHaveProperty('studentCode');
    });

    it('should extract student code from email', async () => {
      const result = await controller.getMyRequests(mockRequest);

      expect(result.studentCode).toBe('TEMP-CODE');
    });

    it('should handle missing user email', async () => {
      const requestWithoutEmail = {
        user: { id: 'user123' },
      };

      const result = await controller.getMyRequests(requestWithoutEmail);

      expect(result).toHaveProperty('message', 'Feature coming soon');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete request lifecycle', async () => {
      const createDto: CreateChangeRequestDto = {
        sourceSubjectId: 'subject001',
        targetSubjectId: 'subject002',
        sourceGroupId: 'group001',
        targetGroupId: 'group002',
        reason: 'Test',
      };

      // Create
      const created = await controller.createChangeRequest(mockRequest, createDto);
      expect(created.status).toBe('PENDING');

      // Get details
      const details = await controller.getRequestDetails(created._id as string);
      expect(details._id).toBe(created._id);

      // Approve
      const approved = await controller.approveRequest(created._id as string, {
        observations: 'Approved',
      });
      expect(approved.status).toBe('APPROVED');
    });

    it('should handle faculty workflow', async () => {
      const facultyId = 'faculty123';

      // Get all requests
      const allRequests = await controller.getRequestsByFaculty(facultyId);
      expect(Array.isArray(allRequests)).toBe(true);

      // Get pending only
      const pendingRequests = await controller.getRequestsByFaculty(
        facultyId,
        RequestState.PENDING,
      );
      expect(Array.isArray(pendingRequests)).toBe(true);
    });

    it('should handle rejection workflow', async () => {
      const createDto: CreateChangeRequestDto = {
        sourceSubjectId: 'subject001',
        targetSubjectId: 'subject002',
        sourceGroupId: 'group001',
        targetGroupId: 'group002',
        reason: 'Test',
      };

      // Create
      const created = await controller.createChangeRequest(mockRequest, createDto);

      // Reject
      const rejected = await controller.rejectRequest(created._id as string, {
        resolutionReason: 'Rejected due to policy',
        observations: 'Additional info',
      });
      expect(rejected.status).toBe('REJECTED');
    });
  });
});
