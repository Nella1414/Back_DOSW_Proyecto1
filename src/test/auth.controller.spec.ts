import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/services/auth.service';
import { ConfigService } from '@nestjs/config';
import { LoginAuthDto } from '../auth/dto/login-auth.dto';
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';
import { RoleName } from '../roles/entities/role.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  let configService: ConfigService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    updateUserRoles: jest.fn(),
    googleLogin: jest.fn(),
    getCurrentUserWithStudent: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUser = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a1',
    email: 'test@example.com',
    displayName: 'Test User',
    externalId: 'test-external-id',
    roles: ['STUDENT'],
    active: true,
  };

  const mockLoginResponse = {
    user: mockUser,
    accessToken: 'mock-jwt-token',
    tokenType: 'Bearer',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterAuthDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        displayName: 'New User',
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      const result = await controller.registerUser(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });

    it('should not return password in response', async () => {
      const registerDto: RegisterAuthDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        displayName: 'New User',
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      const result = await controller.registerUser(registerDto);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.loginUser(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('tokenType', 'Bearer');
    });

    it('should return user data and token', async () => {
      const loginDto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.loginUser(loginDto);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('updateUserRoles', () => {
    it('should update user roles successfully', async () => {
      const newRoles = [RoleName.ADMIN];
      const updatedUser = { ...mockUser, roles: newRoles };

      mockAuthService.updateUserRoles.mockResolvedValue(updatedUser);

      const result = await controller.updateUserRoles('user123', {
        roles: newRoles,
      });

      expect(service.updateUserRoles).toHaveBeenCalledWith('user123', newRoles);
      expect(result.roles).toEqual(newRoles);
    });

    it('should pass userId and roles correctly', async () => {
      const newRoles = [RoleName.DEAN, RoleName.STUDENT];
      const updatedUser = { ...mockUser, roles: newRoles };

      mockAuthService.updateUserRoles.mockResolvedValue(updatedUser);

      await controller.updateUserRoles('user123', { roles: newRoles });

      expect(service.updateUserRoles).toHaveBeenCalledWith('user123', newRoles);
    });
  });

  describe('googleAuthRedirect', () => {
    it('should handle Google auth callback and redirect', async () => {
      const mockReq = {
        user: {
          email: 'google@example.com',
          firstName: 'Google',
          lastName: 'User',
          googleId: 'google-id-123',
        },
      };

      const mockRes = {
        redirect: jest.fn(),
      };

      mockAuthService.googleLogin.mockResolvedValue(mockLoginResponse);
      mockConfigService.get.mockReturnValue('http://localhost:3001');

      await controller.googleAuthRedirect(mockReq, mockRes);

      expect(service.googleLogin).toHaveBeenCalledWith(mockReq.user);
      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/auth/callback?token=mock-jwt-token',
      );
    });

    it('should construct correct redirect URL with token', async () => {
      const mockReq = {
        user: {
          email: 'google@example.com',
          googleId: 'google-id-123',
        },
      };

      const mockRes = {
        redirect: jest.fn(),
      };

      mockAuthService.googleLogin.mockResolvedValue({
        ...mockLoginResponse,
        accessToken: 'test-token-123',
      });
      mockConfigService.get.mockReturnValue('http://localhost:3001');

      await controller.googleAuthRedirect(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/auth/callback?token=test-token-123',
      );
    });
  });

  describe('getMe', () => {
    it('should return current user from request', async () => {
      const mockReq = {
        user: mockUser,
      };

      mockAuthService.getCurrentUserWithStudent.mockResolvedValue({
        user: mockUser,
        tokenType: 'Bearer',
      });

      const result = await controller.getMe(mockReq);

      expect(service.getCurrentUserWithStudent).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: mockUser,
        tokenType: 'Bearer',
      });
    });

    it('should include token type in response', async () => {
      const mockReq = {
        user: mockUser,
      };

      mockAuthService.getCurrentUserWithStudent.mockResolvedValue({
        user: mockUser,
        tokenType: 'Bearer',
      });

      const result = await controller.getMe(mockReq);

      expect(result).toHaveProperty('tokenType');
      expect(result.tokenType).toBe('Bearer');
    });
  });
});
