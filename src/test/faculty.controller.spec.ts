import { Test, TestingModule } from '@nestjs/testing';
import { FacultyController } from '../faculty/faculty.controller';
import { FacultyService } from '../faculty/services/faculty.service';
import { CreateFacultyDto } from '../faculty/dto/create-faculty.dto';
import { UpdateFacultyDto } from '../faculty/dto/update-faculty.dto';

describe('FacultyController', () => {
  let controller: FacultyController;
  let service: FacultyService;

  const mockFacultyService = {
    create: jest.fn().mockReturnValue('This action adds a new faculty'),
    findAll: jest.fn().mockReturnValue(['This action returns all faculty']),
    findOne: jest.fn().mockReturnValue('This action returns a #1 faculty'),
    update: jest.fn().mockReturnValue('This action updates a #1 faculty'),
    remove: jest.fn().mockReturnValue('This action removes a #1 faculty'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacultyController],
      providers: [
        {
          provide: FacultyService,
          useValue: mockFacultyService,
        },
      ],
    }).compile();

    controller = module.get<FacultyController>(FacultyController);
    service = module.get<FacultyService>(FacultyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new faculty', () => {
      const createDto: CreateFacultyDto = {} as any;
      const result = controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe('This action adds a new faculty');
    });

    it('should call service create method once', () => {
      const createDto: CreateFacultyDto = {} as any;
      controller.create(createDto);

      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all faculties', () => {
      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(['This action returns all faculty']);
    });

    it('should call service findAll method once', () => {
      controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single faculty', () => {
      const id = '1';
      const result = controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe('This action returns a #1 faculty');
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
    it('should update a faculty', () => {
      const id = '1';
      const updateDto: UpdateFacultyDto = {} as any;
      const result = controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBe('This action updates a #1 faculty');
    });

    it('should convert string id to number', () => {
      const id = '99';
      const updateDto: UpdateFacultyDto = {} as any;
      controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(99, updateDto);
    });

    it('should call service update method once', () => {
      controller.update('1', {} as any);

      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a faculty', () => {
      const id = '1';
      const result = controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBe('This action removes a #1 faculty');
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

  describe('Integration: Complete faculty lifecycle', () => {
    it('should create, retrieve, update and delete faculties', () => {
      const createDto: CreateFacultyDto = {} as any;
      
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
      const updateDto: UpdateFacultyDto = {} as any;
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
