import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../users/entities/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';
import { RoleName } from '../roles/entities/role.entity';

// Mock bcrypt at the top level
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-1234'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<User>;
  let jwtService: JwtService;

  // Mock user data
  const mockUser = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a1',
    email: 'test@example.com',
    displayName: 'Test User',
    externalId: 'test-external-id',
    roles: ['STUDENT'],
    active: true,
    password: 'hashedPassword123',
    toObject: jest.fn().mockReturnValue({
      _id: '60d5ecb8b0a7c4b4b8b9b1a1',
      email: 'test@example.com',
      displayName: 'Test User',
      externalId: 'test-external-id',
      roles: ['STUDENT'],
      active: true,
    }),
  };

  // Mock model methods
  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterAuthDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      displayName: 'New User',
    };

    it('should create a new user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      const result = await service.register(registerDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(result).toBeDefined();
    });

    it('should throw conflict exception if user already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException('USER_ALREADY_EXISTS', HttpStatus.CONFLICT),
      );
    });

    it('should hash password before storing', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashedPassword123',
        }),
      );
    });

    it('should not return password in response', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      const result = await service.register(registerDto);

      expect(result).not.toHaveProperty('password');
    });

    it('should handle duplicate email error from database', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const duplicateError = { code: 11000, message: 'Duplicate key error' };
      mockUserModel.create.mockRejectedValue(duplicateError);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException('EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT),
      );
    });

    it('should throw internal server error for unexpected errors', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockRejectedValue(new Error('Database error'));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException('REGISTRATION_FAILED', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokenType', 'Bearer');
    });

    it('should throw not found exception if user does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw forbidden exception if password is incorrect', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('PASSWORD_INCORRECT', HttpStatus.FORBIDDEN),
      );
    });

    it('should throw forbidden exception if user is inactive', async () => {
      const inactiveUser = { ...mockUser, active: false };
      mockUserModel.findOne.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('USER_INACTIVE', HttpStatus.FORBIDDEN),
      );
    });

    it('should throw exception if user has no password (OAuth user)', async () => {
      const oauthUser = { ...mockUser, password: null };
      mockUserModel.findOne.mockResolvedValue(oauthUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('INVALID_USER_DATA', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should include correct user data in response', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        displayName: mockUser.displayName,
        externalId: mockUser.externalId,
        roles: mockUser.roles,
        active: mockUser.active,
      });
    });

    it('should generate JWT with correct payload', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        roles: mockUser.roles,
      });
    });
  });

  describe('validateUser', () => {
    it('should return user if valid and active', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser('60d5ecb8b0a7c4b4b8b9b1a1');

      expect(mockUserModel.findById).toHaveBeenCalledWith(
        '60d5ecb8b0a7c4b4b8b9b1a1',
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if user does not exist', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      const result = await service.validateUser('60d5ecb8b0a7c4b4b8b9b1a1');

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const inactiveUser = { ...mockUser, active: false };
      mockUserModel.findById.mockResolvedValue(inactiveUser);

      const result = await service.validateUser('60d5ecb8b0a7c4b4b8b9b1a1');

      expect(result).toBeNull();
    });
  });

  describe('updateUserRoles', () => {
    it('should update user roles successfully', async () => {
      const newRoles = [RoleName.ADMIN, RoleName.STUDENT];
      const updatedUser = { ...mockUser, roles: newRoles };
      mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.updateUserRoles(mockUser._id, newRoles);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { roles: newRoles },
        { new: true },
      );
      expect(result.roles).toEqual(newRoles);
    });

    it('should throw not found exception if user does not exist', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateUserRoles('nonexistent-id', [RoleName.STUDENT]),
      ).rejects.toThrow(
        new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND),
      );
    });

    it('should allow assigning multiple roles', async () => {
      const multipleRoles = [RoleName.ADMIN, RoleName.DEAN, RoleName.STUDENT];
      const updatedUser = { ...mockUser, roles: multipleRoles };
      mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.updateUserRoles(mockUser._id, multipleRoles);

      expect(result.roles).toEqual(multipleRoles);
      expect(result.roles).toHaveLength(3);
    });
  });

  describe('googleLogin', () => {
    const googleUser = {
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      googleId: 'google-id-123',
      picture: 'https://example.com/picture.jpg',
    };

    it('should create new user for first-time Google login', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const newUser = {
        ...mockUser,
        email: googleUser.email,
        googleId: googleUser.googleId,
        isGoogleUser: true,
      };
      mockUserModel.create.mockResolvedValue(newUser);

      const result = await service.googleLogin(googleUser);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: googleUser.email,
          googleId: googleUser.googleId,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          picture: googleUser.picture,
          isGoogleUser: true,
          roles: [RoleName.STUDENT],
        }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result.user.isGoogleUser).toBe(true);
    });

    it('should update existing user with Google info on login', async () => {
      const existingUser = { ...mockUser, googleId: null };
      mockUserModel.findOne.mockResolvedValue(existingUser);
      mockUserModel.findByIdAndUpdate.mockResolvedValue({
        ...existingUser,
        googleId: googleUser.googleId,
      });

      const result = await service.googleLogin(googleUser);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        existingUser._id,
        expect.objectContaining({
          googleId: googleUser.googleId,
          isGoogleUser: true,
        }),
      );
      expect(result).toHaveProperty('accessToken');
    });

    it('should not update user if already has Google ID', async () => {
      const googleExistingUser = {
        ...mockUser,
        googleId: 'existing-google-id',
      };
      mockUserModel.findOne.mockResolvedValue(googleExistingUser);

      await service.googleLogin(googleUser);

      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should assign STUDENT role to new Google users', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser, roles: [RoleName.STUDENT] };
      mockUserModel.create.mockResolvedValue(newUser);

      await service.googleLogin(googleUser);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: [RoleName.STUDENT],
        }),
      );
    });

    it('should generate JWT token for Google login', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.googleLogin(googleUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        roles: mockUser.roles,
      });
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.tokenType).toBe('Bearer');
    });

    it('should include picture in response for Google users', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const newUser = {
        ...mockUser,
        picture: googleUser.picture,
      };
      mockUserModel.create.mockResolvedValue(newUser);

      const result = await service.googleLogin(googleUser);

      expect(result.user).toHaveProperty('picture', googleUser.picture);
    });

    it('should throw exception on Google login failure', async () => {
      mockUserModel.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.googleLogin(googleUser)).rejects.toThrow(
        new HttpException('GOOGLE_LOGIN_FAILED', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should generate unique external ID for new users', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);

      await service.googleLogin(googleUser);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: 'mock-uuid-1234',
        }),
      );
    });
  });
});
