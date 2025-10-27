import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from '../enrollments/enrollments.controller';
import { EnrollmentsService } from '../enrollments/services/enrollments.service';
import { CreateEnrollmentDto } from '../enrollments/dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../enrollments/dto/update-enrollment.dto';
import { EnrollmentStatus } from '../enrollments/entities/enrollment.entity';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let service: EnrollmentsService;

  const mockEnrollment = {
    _id: '60d5ecb8b0a7c4b4b8b9b1a4',
    studentId: 'STU001',
    groupId: 'GROUP001',
    status: EnrollmentStatus.ENROLLED,
    enrolledAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        {
          provide: EnrollmentsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockEnrollment),
            enrollStudentInCourse: jest.fn().mockResolvedValue(mockEnrollment),
            findAll: jest.fn().mockResolvedValue([mockEnrollment]),
            findByStudent: jest.fn().mockResolvedValue([mockEnrollment]),
            findOne: jest.fn().mockResolvedValue(mockEnrollment),
            update: jest
              .fn()
              .mockResolvedValue({ ...mockEnrollment, status: EnrollmentStatus.PASSED }),
            remove: jest.fn().mockResolvedValue({ deleted: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  describe('create', () => {
    it('should create an enrollment', async () => {
      const createDto: CreateEnrollmentDto = {
        studentId: 'STU001',
        groupId: 'GROUP001',
      };

      const result = await controller.create(createDto);

      expect(result).toEqual(mockEnrollment);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should call service with correct dto', async () => {
      const createDto: CreateEnrollmentDto = {
        studentId: 'STU002',
        groupId: 'GROUP002',
      };

      await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('enrollStudent', () => {
    it('should enroll a student in a course group', async () => {
      const studentCode = 'STU001';
      const groupId = 'GROUP001';

      const result = await controller.enrollStudent(studentCode, groupId);

      expect(result).toEqual(mockEnrollment);
      expect(service.enrollStudentInCourse).toHaveBeenCalledWith(studentCode, groupId);
    });

    it('should handle different student codes', async () => {
      await controller.enrollStudent('STU001', 'GROUP001');
      await controller.enrollStudent('STU002', 'GROUP002');

      expect(service.enrollStudentInCourse).toHaveBeenCalledTimes(2);
      expect(service.enrollStudentInCourse).toHaveBeenNthCalledWith(1, 'STU001', 'GROUP001');
      expect(service.enrollStudentInCourse).toHaveBeenNthCalledWith(2, 'STU002', 'GROUP002');
    });
  });

  describe('findAll', () => {
    it('should return all enrollments', async () => {
      const result = await controller.findAll();

      expect(result).toEqual([mockEnrollment]);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should call service findAll', async () => {
      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByStudent', () => {
    it('should return enrollments for a specific student', async () => {
      const studentCode = 'STU001';

      const result = await controller.findByStudent(studentCode);

      expect(result).toEqual([mockEnrollment]);
      expect(service.findByStudent).toHaveBeenCalledWith(studentCode);
    });

    it('should handle different student codes', async () => {
      await controller.findByStudent('STU001');
      await controller.findByStudent('STU002');

      expect(service.findByStudent).toHaveBeenCalledTimes(2);
    });
  });

  describe('findOne', () => {
    it('should return a single enrollment by id', async () => {
      const enrollmentId = '60d5ecb8b0a7c4b4b8b9b1a4';

      const result = await controller.findOne(enrollmentId);

      expect(result).toEqual(mockEnrollment);
      expect(service.findOne).toHaveBeenCalledWith(enrollmentId);
    });

    it('should call service with correct id', async () => {
      const enrollmentId = 'test-id-123';

      await controller.findOne(enrollmentId);

      expect(service.findOne).toHaveBeenCalledWith(enrollmentId);
    });
  });

  describe('update', () => {
    it('should update an enrollment', async () => {
      const enrollmentId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const updateDto: UpdateEnrollmentDto = {
        status: EnrollmentStatus.PASSED,
      };

      const result = await controller.update(enrollmentId, updateDto);

      expect(result).toHaveProperty('status', EnrollmentStatus.PASSED);
      expect(service.update).toHaveBeenCalledWith(enrollmentId, updateDto);
    });

    it('should handle partial updates', async () => {
      const enrollmentId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const updateDto: UpdateEnrollmentDto = {};

      await controller.update(enrollmentId, updateDto);

      expect(service.update).toHaveBeenCalledWith(enrollmentId, updateDto);
    });

    it('should return updated enrollment', async () => {
      const enrollmentId = '60d5ecb8b0a7c4b4b8b9b1a4';
      const updateDto: UpdateEnrollmentDto = {
        status: EnrollmentStatus.PASSED,
      };

      const result = await controller.update(enrollmentId, updateDto);

      expect(result).toHaveProperty('_id', enrollmentId);
      expect(result).toHaveProperty('status', EnrollmentStatus.PASSED);
    });
  });

  describe('remove', () => {
    it('should remove an enrollment', async () => {
      const enrollmentId = '60d5ecb8b0a7c4b4b8b9b1a4';

      const result = await controller.remove(enrollmentId);

      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith(enrollmentId);
    });

    it('should call service remove with correct id', async () => {
      const enrollmentId = 'test-id-456';

      await controller.remove(enrollmentId);

      expect(service.remove).toHaveBeenCalledWith(enrollmentId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete enrollment lifecycle', async () => {
      // Create
      const createDto: CreateEnrollmentDto = {
        studentId: 'STU001',
        groupId: 'GROUP001',
      };
      const created = await controller.create(createDto);
      expect(created).toBeDefined();

      // Find
      const found = await controller.findOne(mockEnrollment._id);
      expect(found).toBeDefined();

      // Update
      const updated = await controller.update(mockEnrollment._id, {
        status: EnrollmentStatus.PASSED,
      });
      expect(updated.status).toBe(EnrollmentStatus.PASSED);

      // Remove
      const removed = await controller.remove(mockEnrollment._id);
      expect(removed).toHaveProperty('deleted', true);
    });

    it('should handle student enrollment workflow', async () => {
      const studentCode = 'STU001';

      // Enroll in course
      const enrollment = await controller.enrollStudent(studentCode, 'GROUP001');
      expect(enrollment.studentId).toBeDefined();

      // Get student enrollments
      const enrollments = await controller.findByStudent(studentCode);
      expect(Array.isArray(enrollments)).toBe(true);
    });

    it('should handle multiple operations', async () => {
      // Create multiple
      await controller.create({ studentId: 'STU001', groupId: 'GROUP001' });
      await controller.create({ studentId: 'STU002', groupId: 'GROUP002' });

      // Find all
      const all = await controller.findAll();
      expect(Array.isArray(all)).toBe(true);

      // Verify service calls
      expect(service.create).toHaveBeenCalledTimes(2);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
