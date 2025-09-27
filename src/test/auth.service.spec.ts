import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RoleName } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt at the top level
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
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
    jest.restoreAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
    };

    it('should create a new user successfully', async () => {
      // Arrange
      mockUserModel.findOne.mockResolvedValue(null); // User doesn't exist
      mockUserModel.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: registerDto.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(result).toBeDefined();
    });

    it('should throw conflict exception if user already exists', async () => {
      // Arrange
      mockUserModel.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException('USER_ALREADY_EXISTS', HttpStatus.CONFLICT)
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      // Arrange
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokenType', 'Bearer');
    });

    it('should throw not found exception if user does not exist', async () => {
      // Arrange
      mockUserModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw forbidden exception if user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, active: false };
      mockUserModel.findOne.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('USER_INACTIVE', HttpStatus.FORBIDDEN)
      );
    });

    it('should throw forbidden exception if password is incorrect', async () => {
      // Arrange
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('PASSWORD_INCORRECT', HttpStatus.FORBIDDEN)
      );
    });
  });

  describe('updateUserRoles', () => {
    it('should update user roles successfully', async () => {
      // Arrange
      const userId = '60d5ecb8b0a7c4b4b8b9b1a1';
      const newRoles = ['ADMIN'];
      const updatedUser = { ...mockUser, roles: newRoles };
      mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUserRoles(userId, newRoles);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { roles: newRoles },
        { new: true }
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw not found exception if user does not exist', async () => {
      // Arrange
      const userId = '60d5ecb8b0a7c4b4b8b9b1a1';
      const newRoles = ['ADMIN'];
      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateUserRoles(userId, newRoles)).rejects.toThrow(
        new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if valid and active', async () => {
      // Arrange
      mockUserModel.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser('60d5ecb8b0a7c4b4b8b9b1a1');

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith('60d5ecb8b0a7c4b4b8b9b1a1');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user does not exist', async () => {
      // Arrange
      mockUserModel.findById.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('60d5ecb8b0a7c4b4b8b9b1a1');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, active: false };
      mockUserModel.findById.mockResolvedValue(inactiveUser);

      // Act
      const result = await service.validateUser('60d5ecb8b0a7c4b4b8b9b1a1');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('googleLogin', () => {
    const googleUser = {
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      googleId: 'google-123',
      picture: 'https://example.com/picture.jpg'
    };

    it('should create new user and login with Google', async () => {
      // Arrange
      mockUserModel.findOne.mockResolvedValue(null); // User doesn't exist
      const newGoogleUser = {
        ...mockUser,
        email: googleUser.email,
        displayName: 'Google User',
        googleId: googleUser.googleId,
        isGoogleUser: true,
        picture: googleUser.picture
      };
      mockUserModel.create.mockResolvedValue(newGoogleUser);

      // Act
      const result = await service.googleLogin(googleUser);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: googleUser.email });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: googleUser.email,
        displayName: 'Google User',
        externalId: expect.any(String),
        roles: [RoleName.STUDENT],
        active: true,
        googleId: googleUser.googleId,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        picture: googleUser.picture,
        isGoogleUser: true,
      });
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokenType', 'Bearer');
    });

    it('should login existing user with Google', async () => {
      // Arrange
      const existingUser = { ...mockUser, email: googleUser.email };
      mockUserModel.findOne.mockResolvedValue(existingUser);

      // Act
      const result = await service.googleLogin(googleUser);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: googleUser.email });
      expect(mockUserModel.create).not.toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.isGoogleUser).toBe(true);
    });

    it('should update existing user with Google info if not already set', async () => {
      // Arrange
      const existingUserWithoutGoogle = {
        ...mockUser,
        email: googleUser.email,
        googleId: undefined
      };
      mockUserModel.findOne.mockResolvedValue(existingUserWithoutGoogle);
      mockUserModel.findByIdAndUpdate.mockResolvedValue(existingUserWithoutGoogle);

      // Act
      await service.googleLogin(googleUser);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        existingUserWithoutGoogle._id,
        {
          googleId: googleUser.googleId,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          picture: googleUser.picture,
          isGoogleUser: true,
        }
      );
    });
  });
});
