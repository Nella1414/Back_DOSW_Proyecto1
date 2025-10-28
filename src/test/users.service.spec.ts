import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/services/users.service';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockUser = {
    _id: mockUserId,
    externalId: 'test-external-id',
    email: 'test@example.com',
    displayName: 'Test User',
    active: true,
    roles: ['STUDENT'],
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'hashedPassword123',
  };

  const mockUserDocument = {
    ...mockUser,
    _id: { toString: () => mockUserId },
  };

  const mockUserModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockSelectChain = {
    exec: jest.fn(),
    select: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        externalId: 'test-external-id',
        email: 'test@example.com',
        displayName: 'Test User',
        active: true,
        roles: ['STUDENT'],
        password: 'password123',
      };

      mockUserModel.create.mockResolvedValue(mockUserDocument);

      const result = await service.create(createUserDto);

      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        _id: mockUserId,
        externalId: mockUser.externalId,
        email: mockUser.email,
        displayName: mockUser.displayName,
        active: mockUser.active,
        roles: mockUser.roles,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const users = [mockUserDocument];
      mockSelectChain.exec.mockResolvedValue(users);
      mockSelectChain.select.mockReturnValue(mockSelectChain);
      mockUserModel.find.mockReturnValue(mockSelectChain);

      const result = await service.findAll();

      expect(mockUserModel.find).toHaveBeenCalledWith({});
      expect(mockSelectChain.select).toHaveBeenCalledWith('-password');
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]._id).toBe(mockUserId);
    });

    it('should return empty array when no users exist', async () => {
      mockSelectChain.exec.mockResolvedValue([]);
      mockSelectChain.select.mockReturnValue(mockSelectChain);
      mockUserModel.find.mockReturnValue(mockSelectChain);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockSelectChain.exec.mockResolvedValue(mockUserDocument);
      mockSelectChain.select.mockReturnValue(mockSelectChain);
      mockUserModel.findById.mockReturnValue(mockSelectChain);

      const result = await service.findOne(mockUserId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockSelectChain.select).toHaveBeenCalledWith('-password');
      expect(result._id).toBe(mockUserId);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockSelectChain.exec.mockResolvedValue(null);
      mockSelectChain.select.mockReturnValue(mockSelectChain);
      mockUserModel.findById.mockReturnValue(mockSelectChain);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        'User with ID nonexistent-id not found',
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        displayName: 'Updated Name',
        active: false,
      };

      const updatedUser = {
        ...mockUserDocument,
        ...updateUserDto,
      };

      mockSelectChain.exec.mockResolvedValue(updatedUser);
      mockSelectChain.select.mockReturnValue(mockSelectChain);
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockSelectChain);

      const result = await service.update(mockUserId, updateUserDto);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        updateUserDto,
        { new: true },
      );
      expect(mockSelectChain.select).toHaveBeenCalledWith('-password');
      expect(result.displayName).toBe(updateUserDto.displayName);
      expect(result.active).toBe(updateUserDto.active);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when user to update is not found', async () => {
      mockSelectChain.exec.mockResolvedValue(null);
      mockSelectChain.select.mockReturnValue(mockSelectChain);
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockSelectChain);

      const updateUserDto: UpdateUserDto = { displayName: 'Updated Name' };

      await expect(
        service.update('nonexistent-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('nonexistent-id', updateUserDto),
      ).rejects.toThrow('User with ID nonexistent-id not found');
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockSelectChain.exec.mockResolvedValue(mockUserDocument);
      mockUserModel.findByIdAndDelete.mockReturnValue(mockSelectChain);

      await service.remove(mockUserId);

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw NotFoundException when user to delete is not found', async () => {
      mockSelectChain.exec.mockResolvedValue(null);
      mockUserModel.findByIdAndDelete.mockReturnValue(mockSelectChain);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        'User with ID nonexistent-id not found',
      );
    });
  });
});
