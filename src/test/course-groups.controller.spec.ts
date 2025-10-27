import { Test, TestingModule } from '@nestjs/testing';
import { CourseGroupsController } from '../course-groups/course-groups.controller';
import { CourseGroupsService } from '../course-groups/services/course-groups.service';
import { CreateCourseGroupDto } from '../course-groups/dto/create-course-group.dto';
import { UpdateCourseGroupDto } from '../course-groups/dto/update-course-group.dto';

describe('CourseGroupsController', () => {
  let controller: CourseGroupsController;
  let service: CourseGroupsService;

  const mockCourseGroup = {
    _id: '507f1f77bcf86cd799439011',
    courseId: '507f1f77bcf86cd799439012',
    groupNumber: 'G01',
    periodId: '507f1f77bcf86cd799439013',
    maxStudents: 30,
    currentEnrollments: 15,
    professorId: '507f1f77bcf86cd799439014',
    isActive: true,
    classroom: 'A-201',
    observations: 'Regular group',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCourseGroupsService = {
    create: jest.fn().mockResolvedValue(mockCourseGroup),
    findAll: jest.fn().mockResolvedValue([mockCourseGroup]),
    getAvailableGroups: jest.fn().mockResolvedValue([mockCourseGroup]),
    findByPeriod: jest.fn().mockResolvedValue([mockCourseGroup]),
    findByCourse: jest.fn().mockResolvedValue([mockCourseGroup]),
    findOne: jest.fn().mockResolvedValue(mockCourseGroup),
    update: jest.fn().mockResolvedValue({ ...mockCourseGroup, maxStudents: 35 }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
    updateEnrollmentCount: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseGroupsController],
      providers: [
        {
          provide: CourseGroupsService,
          useValue: mockCourseGroupsService,
        },
      ],
    }).compile();

    controller = module.get<CourseGroupsController>(CourseGroupsController);
    service = module.get<CourseGroupsService>(CourseGroupsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a course group', async () => {
      const createDto: CreateCourseGroupDto = {
        courseId: '507f1f77bcf86cd799439012',
        groupNumber: 'G01',
        periodId: '507f1f77bcf86cd799439013',
        maxStudents: 30,
        professorId: '507f1f77bcf86cd799439014',
        isActive: true,
        classroom: 'A-201',
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCourseGroup);
    });

    it('should create a course group with minimal data', async () => {
      const createDto: CreateCourseGroupDto = {
        courseId: '507f1f77bcf86cd799439012',
        groupNumber: 'G01',
        periodId: '507f1f77bcf86cd799439013',
        maxStudents: 30,
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCourseGroup);
    });
  });

  describe('findAll', () => {
    it('should return an array of course groups', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockCourseGroup]);
    });
  });

  describe('getAvailable', () => {
    it('should return available course groups without filters', async () => {
      const result = await controller.getAvailable();

      expect(service.getAvailableGroups).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual([mockCourseGroup]);
    });

    it('should return available course groups filtered by courseId', async () => {
      const courseId = '507f1f77bcf86cd799439012';
      const result = await controller.getAvailable(courseId);

      expect(service.getAvailableGroups).toHaveBeenCalledWith(courseId, undefined);
      expect(result).toEqual([mockCourseGroup]);
    });

    it('should return available course groups filtered by periodId', async () => {
      const periodId = '507f1f77bcf86cd799439013';
      const result = await controller.getAvailable(undefined, periodId);

      expect(service.getAvailableGroups).toHaveBeenCalledWith(undefined, periodId);
      expect(result).toEqual([mockCourseGroup]);
    });

    it('should return available course groups filtered by courseId and periodId', async () => {
      const courseId = '507f1f77bcf86cd799439012';
      const periodId = '507f1f77bcf86cd799439013';
      const result = await controller.getAvailable(courseId, periodId);

      expect(service.getAvailableGroups).toHaveBeenCalledWith(courseId, periodId);
      expect(result).toEqual([mockCourseGroup]);
    });
  });

  describe('findByPeriod', () => {
    it('should return course groups for a specific period', async () => {
      const periodId = '507f1f77bcf86cd799439013';
      const result = await controller.findByPeriod(periodId);

      expect(service.findByPeriod).toHaveBeenCalledWith(periodId);
      expect(result).toEqual([mockCourseGroup]);
    });
  });

  describe('findByCourse', () => {
    it('should return course groups for a specific course', async () => {
      const courseId = '507f1f77bcf86cd799439012';
      const result = await controller.findByCourse(courseId);

      expect(service.findByCourse).toHaveBeenCalledWith(courseId, undefined);
      expect(result).toEqual([mockCourseGroup]);
    });

    it('should return course groups for a specific course and period', async () => {
      const courseId = '507f1f77bcf86cd799439012';
      const periodId = '507f1f77bcf86cd799439013';
      const result = await controller.findByCourse(courseId, periodId);

      expect(service.findByCourse).toHaveBeenCalledWith(courseId, periodId);
      expect(result).toEqual([mockCourseGroup]);
    });
  });

  describe('findOne', () => {
    it('should return a single course group', async () => {
      const id = '507f1f77bcf86cd799439011';
      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockCourseGroup);
    });
  });

  describe('update', () => {
    it('should update a course group', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateCourseGroupDto = {
        maxStudents: 35,
      };

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual({ ...mockCourseGroup, maxStudents: 35 });
    });

    it('should update course group classroom and professor', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateCourseGroupDto = {
        classroom: 'B-305',
        professorId: '507f1f77bcf86cd799439015',
      };

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove a course group', async () => {
      const id = '507f1f77bcf86cd799439011';
      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('updateEnrollmentCount', () => {
    it('should update enrollment count and return success message', async () => {
      const id = '507f1f77bcf86cd799439011';
      const result = await controller.updateEnrollmentCount(id);

      expect(service.updateEnrollmentCount).toHaveBeenCalledWith(id);
      expect(result).toEqual({ message: 'Enrollment count updated successfully' });
    });
  });

  // Integration scenarios
  describe('Integration: Complete course group management lifecycle', () => {
    it('should create, retrieve, update and delete a course group', async () => {
      const createDto: CreateCourseGroupDto = {
        courseId: '507f1f77bcf86cd799439012',
        groupNumber: 'G01',
        periodId: '507f1f77bcf86cd799439013',
        maxStudents: 30,
      };

      // Create
      const created = await controller.create(createDto);
      expect(created).toEqual(mockCourseGroup);

      // Find
      const found = await controller.findOne(mockCourseGroup._id as string);
      expect(found).toEqual(mockCourseGroup);

      // Update
      const updateDto: UpdateCourseGroupDto = { maxStudents: 35 };
      const updated = await controller.update(mockCourseGroup._id as string, updateDto);
      expect(updated).toBeDefined();

      // Delete
      const deleted = await controller.remove(mockCourseGroup._id as string);
      expect(deleted).toEqual({ deleted: true });
    });
  });

  describe('Integration: Available groups workflow', () => {
    it('should filter available groups by course and period', async () => {
      const courseId = '507f1f77bcf86cd799439012';
      const periodId = '507f1f77bcf86cd799439013';

      // Get available groups
      const available = await controller.getAvailable(courseId, periodId);
      expect(available).toEqual([mockCourseGroup]);
      expect(service.getAvailableGroups).toHaveBeenCalledWith(courseId, periodId);

      // Get by period
      const byPeriod = await controller.findByPeriod(periodId);
      expect(byPeriod).toEqual([mockCourseGroup]);

      // Get by course
      const byCourse = await controller.findByCourse(courseId, periodId);
      expect(byCourse).toEqual([mockCourseGroup]);
    });
  });

  describe('Integration: Enrollment count management', () => {
    it('should manage enrollment count updates', async () => {
      const groupId = mockCourseGroup._id as string;

      // Get initial state
      const group = await controller.findOne(groupId);
      expect(group.currentEnrollments).toBe(15);

      // Update enrollment count
      const result = await controller.updateEnrollmentCount(groupId);
      expect(result.message).toBe('Enrollment count updated successfully');
      expect(service.updateEnrollmentCount).toHaveBeenCalledWith(groupId);
    });
  });
});
