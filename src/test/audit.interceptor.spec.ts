import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { AuditService } from '../common/services/audit.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AUDIT_CREATE_KEY } from '../common/decorators/audit-create.decorator';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: jest.Mocked<AuditService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    auditService = {
      logCreateEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    reflector = {
      get: jest.fn(),
    } as any;

    interceptor = new AuditInterceptor(auditService, reflector);
  });

  function createMockContext(requestData: any = {}): ExecutionContext {
    const defaultRequest = {
      user: { id: 'user123' },
      body: { name: 'Test Entity' },
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
      ...requestData,
    };

    return {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(defaultRequest),
      }),
    } as any;
  }

  function createMockCallHandler(response: any): CallHandler {
    return {
      handle: jest.fn().mockReturnValue(of(response)),
    } as any;
  }

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should not log if no audit decorator is present', (done) => {
    reflector.get.mockReturnValue(null);
    const context = createMockContext();
    const callHandler = createMockCallHandler({ id: '123' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).not.toHaveBeenCalled();
      done();
    });
  });

  it('should log create event when audit decorator is present and response has id', (done) => {
    reflector.get.mockReturnValue('ChangeRequest');
    const context = createMockContext();
    const callHandler = createMockCallHandler({ id: 'entity123', name: 'Test' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        'entity123',
        'user123',
        {
          entityType: 'ChangeRequest',
          data: { name: 'Test Entity' },
          response: {
            id: 'entity123',
            status: 'created',
          },
        },
        '192.168.1.1',
        'Mozilla/5.0',
      );
      done();
    });
  });

  it('should handle MongoDB _id format', (done) => {
    reflector.get.mockReturnValue('Student');
    const context = createMockContext();
    const callHandler = createMockCallHandler({
      _id: { toString: () => 'mongo-id-123' },
      name: 'Student',
    });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        'mongo-id-123',
        'user123',
        expect.objectContaining({
          entityType: 'Student',
          response: {
            id: 'mongo-id-123',
            status: 'created',
          },
        }),
        '192.168.1.1',
        'Mozilla/5.0',
      );
      done();
    });
  });

  it('should use "anonymous" for user when no user is present', (done) => {
    reflector.get.mockReturnValue('Document');
    const context = createMockContext({
      user: undefined,
      body: { title: 'Doc' },
      ip: '10.0.0.1',
      headers: { 'user-agent': 'Chrome' },
    });
    const callHandler = createMockCallHandler({ id: 'doc123' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        'doc123',
        'anonymous',
        expect.any(Object),
        '10.0.0.1',
        'Chrome',
      );
      done();
    });
  });

  it('should not log if response has no id or _id', (done) => {
    reflector.get.mockReturnValue('Entity');
    const context = createMockContext();
    const callHandler = createMockCallHandler({ name: 'No ID' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).not.toHaveBeenCalled();
      done();
    });
  });

  it('should read decorator metadata using AUDIT_CREATE_KEY', (done) => {
    reflector.get.mockReturnValue('TestEntity');
    const context = createMockContext();
    const callHandler = createMockCallHandler({ id: '456' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(reflector.get).toHaveBeenCalledWith(AUDIT_CREATE_KEY, context.getHandler());
      done();
    });
  });

  it('should include request body in audit data', (done) => {
    reflector.get.mockReturnValue('Order');
    const requestBody = { productId: 'prod-123', quantity: 5 };
    const context = createMockContext({
      user: { id: 'user456' },
      body: requestBody,
      ip: '172.16.0.1',
      headers: { 'user-agent': 'Safari' },
    });
    const callHandler = createMockCallHandler({ id: 'order789' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        'order789',
        'user456',
        expect.objectContaining({
          data: requestBody,
        }),
        expect.any(String),
        expect.any(String),
      );
      done();
    });
  });

  it('should capture IP address correctly', (done) => {
    reflector.get.mockReturnValue('Session');
    const testIp = '203.0.113.42';
    const context = createMockContext({
      user: { id: 'user999' },
      body: {},
      ip: testIp,
      headers: { 'user-agent': 'Edge' },
    });
    const callHandler = createMockCallHandler({ id: 'session123' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        testIp,
        expect.any(String),
      );
      done();
    });
  });

  it('should capture user-agent header correctly', (done) => {
    reflector.get.mockReturnValue('Comment');
    const userAgent = 'CustomApp/1.0';
    const context = createMockContext({
      user: { id: 'user555' },
      body: { text: 'Test comment' },
      ip: '192.0.2.1',
      headers: { 'user-agent': userAgent },
    });
    const callHandler = createMockCallHandler({ id: 'comment456' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        userAgent,
      );
      done();
    });
  });

  it('should pass through observable when no decorator', (done) => {
    reflector.get.mockReturnValue(null);
    const testResponse = { data: 'test' };
    const context = createMockContext();
    const callHandler = createMockCallHandler(testResponse);

    interceptor.intercept(context, callHandler).subscribe((result) => {
      expect(result).toEqual(testResponse);
      done();
    });
  });

  it('should handle empty response object', (done) => {
    reflector.get.mockReturnValue('Entity');
    const context = createMockContext();
    const callHandler = createMockCallHandler({});

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).not.toHaveBeenCalled();
      done();
    });
  });

  it('should handle null response', (done) => {
    reflector.get.mockReturnValue('Entity');
    const context = createMockContext();
    const callHandler = createMockCallHandler(null);

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).not.toHaveBeenCalled();
      done();
    });
  });

  it('should handle undefined response', (done) => {
    reflector.get.mockReturnValue('Entity');
    const context = createMockContext();
    const callHandler = createMockCallHandler(undefined);

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).not.toHaveBeenCalled();
      done();
    });
  });

  it('should prefer id over _id when both are present', (done) => {
    reflector.get.mockReturnValue('Entity');
    const context = createMockContext();
    const callHandler = createMockCallHandler({
      id: 'standard-id',
      _id: { toString: () => 'mongo-id' },
    });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        'standard-id',
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        expect.any(String),
      );
      done();
    });
  });

  it('should include entity type in audit metadata', (done) => {
    const entityType = 'CustomEntity';
    reflector.get.mockReturnValue(entityType);
    const context = createMockContext();
    const callHandler = createMockCallHandler({ id: 'custom123' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          entityType: entityType,
        }),
        expect.any(String),
        expect.any(String),
      );
      done();
    });
  });

  it('should include response metadata with status created', (done) => {
    reflector.get.mockReturnValue('Report');
    const context = createMockContext();
    const callHandler = createMockCallHandler({ id: 'report999' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(auditService.logCreateEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          response: {
            id: 'report999',
            status: 'created',
          },
        }),
        expect.any(String),
        expect.any(String),
      );
      done();
    });
  });
});
