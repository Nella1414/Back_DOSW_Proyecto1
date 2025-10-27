import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from '../courses/courses.controller';
import { CoursesService } from '../courses/services/courses.service';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { UpdateCourseDto } from '../courses/dto/update-course.dto';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    create: jest.fn().mockReturnValue('This action adds a new course'),
    findAll: jest.fn().mockReturnValue(['This action returns all courses']),
    findOne: jest.fn().mockReturnValue('This action returns a #1 course'),
    update: jest.fn().mockReturnValue('This action updates a #1 course'),
    remove: jest.fn().mockReturnValue('This action removes a #1 course'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new course', () => {
      const createDto: CreateCourseDto = {} as any;
      const result = controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe('This action adds a new course');
    });

    it('should call service create method once', () => {
      const createDto: CreateCourseDto = {} as any;
      controller.create(createDto);

      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all courses', () => {
      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(['This action returns all courses']);
    });

    it('should call service findAll method once', () => {
      controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single course', () => {
      const id = '1';
      const result = controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe('This action returns a #1 course');
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
    it('should update a course', () => {
      const id = '1';
      const updateDto: UpdateCourseDto = {} as any;
      const result = controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBe('This action updates a #1 course');
    });

    it('should convert string id to number', () => {
      const id = '99';
      const updateDto: UpdateCourseDto = {} as any;
      controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(99, updateDto);
    });

    it('should call service update method once', () => {
      controller.update('1', {} as any);

      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a course', () => {
      const id = '1';
      const result = controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBe('This action removes a #1 course');
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

  describe('Integration: Complete course lifecycle', () => {
    it('should create, retrieve, update and delete courses', () => {
      const createDto: CreateCourseDto = {} as any;
      
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
      const updateDto: UpdateCourseDto = {} as any;
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
