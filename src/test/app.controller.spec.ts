import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../app/app.controller';
import { AppService } from '../app/services/app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: jest.Mocked<AppService>;

  beforeEach(async () => {
    const mockService = {
      getApiInfo: jest.fn(),
      getHealth: jest.fn(),
      getStatus: jest.fn(),
      getVersion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getApiInfo', () => {
    it('should return API information', () => {
      const mockApiInfo = {
        name: 'SIRHA - Student Information & Registration Hub API',
        version: '1.0.2',
        description: 'Academic Management System REST API',
        documentation: '/doc',
        endpoints: {
          health: '/health',
          status: '/status',
          version: '/version',
        },
      };

      service.getApiInfo.mockReturnValue(mockApiInfo);

      const result = controller.getApiInfo();

      expect(service.getApiInfo).toHaveBeenCalled();
      expect(result).toEqual(mockApiInfo);
    });
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          api: {
            status: 'ok',
            message: 'API service is running',
          },
          database: {
            status: 'ok',
            message: 'Database connection active',
          },
        },
      };

      service.getHealth.mockResolvedValue(mockHealth);

      const result = await controller.getHealth();

      expect(service.getHealth).toHaveBeenCalled();
      expect(result).toEqual(mockHealth);
    });

    it('should return unhealthy status when database is down', async () => {
      const mockHealth = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          api: {
            status: 'ok',
            message: 'API service is running',
          },
          database: {
            status: 'error',
            message: 'Database connection failed',
          },
        },
      };

      service.getHealth.mockResolvedValue(mockHealth);

      const result = await controller.getHealth();

      expect(result).toEqual(mockHealth);
    });
  });

  describe('getStatus', () => {
    it('should return application status', async () => {
      const mockStatus = {
        application: {
          name: 'SIRHA',
          version: '1.0.2',
          environment: 'development',
        },
        database: {
          type: 'MongoDB',
          status: 'connected',
          name: 'test-db',
        },
        server: {
          uptime: '5 minutes',
          startTime: new Date().toISOString(),
        },
      };

      service.getStatus.mockResolvedValue(mockStatus);

      const result = await controller.getStatus();

      expect(service.getStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getVersion', () => {
    it('should return version information', () => {
      const mockVersion = {
        version: '1.0.2',
        apiName: 'SIRHA API',
        releaseDate: '2025-01-15',
        description: 'Student Information & Registration Hub API',
        changelog: {
          '1.0.2': ['Added comprehensive health check endpoints'],
        },
      };

      service.getVersion.mockReturnValue(mockVersion);

      const result = controller.getVersion();

      expect(service.getVersion).toHaveBeenCalled();
      expect(result).toEqual(mockVersion);
    });
  });
});
