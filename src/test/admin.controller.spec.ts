import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin/admin.controller';
import { AdminService } from '../admin/services/admin.service';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import { UpdateAdminDto } from '../admin/dto/update-admin.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    create: jest.fn().mockReturnValue('This action adds a new admin'),
    findAll: jest.fn().mockReturnValue(['This action returns all admin']),
    findOne: jest.fn().mockReturnValue('This action returns a #1 admin'),
    update: jest.fn().mockReturnValue('This action updates a #1 admin'),
    remove: jest.fn().mockReturnValue('This action removes a #1 admin'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new admin operation', () => {
      const createDto: CreateAdminDto = {};
      const result = controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe('This action adds a new admin');
    });

    it('should call service create method once', () => {
      const createDto: CreateAdminDto = {};
      controller.create(createDto);

      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all admin operations', () => {
      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(['This action returns all admin']);
    });

    it('should call service findAll method once', () => {
      controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single admin operation', () => {
      const id = '1';
      const result = controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe('This action returns a #1 admin');
    });

    it('should convert string id to number', () => {
      const id = '42';
      controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(42);
    });

    it('should call service findOne method once', () => {
      controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update an admin operation', () => {
      const id = '1';
      const updateDto: UpdateAdminDto = {};
      const result = controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBe('This action updates a #1 admin');
    });

    it('should convert string id to number', () => {
      const id = '99';
      const updateDto: UpdateAdminDto = {};
      controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(99, updateDto);
    });

    it('should call service update method once', () => {
      controller.update('1', {});

      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove an admin operation', () => {
      const id = '1';
      const result = controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBe('This action removes a #1 admin');
    });

    it('should convert string id to number', () => {
      const id = '123';
      controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(123);
    });

    it('should call service remove method once', () => {
      controller.remove('1');

      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration: Complete admin operation lifecycle', () => {
    it('should create, retrieve, update and delete admin operations', () => {
      const createDto: CreateAdminDto = {};
      
      // Create
      const created = controller.create(createDto);
      expect(created).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);

      // Find all
      const all = controller.findAll();
      expect(all).toBeDefined();
      expect(service.findAll).toHaveBeenCalled();

      // Find one
      const one = controller.findOne('1');
      expect(one).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith(1);

      // Update
      const updateDto: UpdateAdminDto = {};
      const updated = controller.update('1', updateDto);
      expect(updated).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(1, updateDto);

      // Remove
      const removed = controller.remove('1');
      expect(removed).toBeDefined();
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
