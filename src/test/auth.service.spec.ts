import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';

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
    const registerDto: RegisterAuthDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
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

      const testDto: RegisterAuthDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        displayName: 'New User',
      };

      // Act & Assert
      await expect(service.register(testDto)).rejects.toThrow(
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
  });
});
