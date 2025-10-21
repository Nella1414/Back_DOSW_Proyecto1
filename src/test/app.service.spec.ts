import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppService } from '../app/services/app.service';

describe('AppService', () => {
  let service: AppService;
  let mockConnection: any;

  beforeEach(async () => {
    mockConnection = {
      readyState: 1, // 1 = connected
      name: 'test-database',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getApiInfo', () => {
    it('should return API information', () => {
      const result = service.getApiInfo();

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('documentation', '/doc');
      expect(result).toHaveProperty('endpoints');
      expect(result).toHaveProperty('message');
    });

    it('should include correct endpoints information', () => {
      const result: any = service.getApiInfo();

      expect(result.endpoints).toHaveProperty('health', '/health');
      expect(result.endpoints).toHaveProperty('status', '/status');
      expect(result.endpoints).toHaveProperty('version', '/version');
    });
  });

  describe('getHealth', () => {
    it('should return healthy status when database is connected', async () => {
      mockConnection.readyState = 1; // connected

      const result: any = await service.getHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('checks');
      expect(result.checks.api.status).toBe('ok');
      expect(result.checks.database.status).toBe('ok');
    });

    it('should return unhealthy status when database is disconnected', async () => {
      mockConnection.readyState = 0; // disconnected

      const result: any = await service.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('error');
    });

    it('should include timestamp in health check', async () => {
      const result: any = await service.getHealth();

      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    it('should always report API as ok', async () => {
      const result: any = await service.getHealth();

      expect(result.checks.api.status).toBe('ok');
      expect(result.checks.api.message).toBe('API service is running');
    });
  });

  describe('getStatus', () => {
    it('should return application status information', async () => {
      const result: any = await service.getStatus();

      expect(result).toHaveProperty('application');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('server');
    });

    it('should include version information', async () => {
      const result: any = await service.getStatus();

      expect(result.application).toHaveProperty('version');
      expect(result.application).toHaveProperty('environment');
    });

    it('should include uptime information', async () => {
      const result: any = await service.getStatus();

      expect(result.server).toHaveProperty('uptime');
      expect(result.server).toHaveProperty('startTime');
    });

    it('should include database status', async () => {
      const result: any = await service.getStatus();

      expect(result.database).toHaveProperty('status');
      expect(result.database).toHaveProperty('name');
    });
  });

  describe('getVersion', () => {
    it('should return version information', () => {
      const result: any = service.getVersion();

      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('apiName');
      expect(result).toHaveProperty('description');
    });

    it('should include release date', () => {
      const result: any = service.getVersion();

      expect(result).toHaveProperty('releaseDate');
    });

    it('should include changelog', () => {
      const result: any = service.getVersion();

      expect(result).toHaveProperty('changelog');
      expect(result.changelog).toBeDefined();
      expect(typeof result.changelog).toBe('object');
    });
  });
});
