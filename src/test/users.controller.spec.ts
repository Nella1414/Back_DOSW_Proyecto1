import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/services/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser: UserResponseDto = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a1',
    externalId: 'test-external-id',
    email: 'test@example.com',
    displayName: 'Test User',
    active: true,
    roles: ['STUDENT'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
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

      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      service.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no users exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('60d5ecb8b0a7c4b4b8b9b1a1');

      expect(service.findOne).toHaveBeenCalledWith('60d5ecb8b0a7c4b4b8b9b1a1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        displayName: 'Updated Name',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        '60d5ecb8b0a7c4b4b8b9b1a1',
        updateUserDto,
      );

      expect(service.update).toHaveBeenCalledWith(
        '60d5ecb8b0a7c4b4b8b9b1a1',
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
      expect(result.displayName).toBe('Updated Name');
    });

    it('should update user active status', async () => {
      const updateUserDto: UpdateUserDto = {
        active: false,
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        '60d5ecb8b0a7c4b4b8b9b1a1',
        updateUserDto,
      );

      expect(result.active).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('60d5ecb8b0a7c4b4b8b9b1a1');

      expect(service.remove).toHaveBeenCalledWith('60d5ecb8b0a7c4b4b8b9b1a1');
    });
  });
});
