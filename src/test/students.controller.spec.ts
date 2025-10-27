import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from '../students/students.controller';
import { StudentsService } from '../students/services/students.service';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { UpdateStudentDto } from '../students/dto/update-student.dto';

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: StudentsService;

  const mockStudent = {
    _id: '507f1f77bcf86cd799439011',
    code: 'EST001',
    firstName: 'Juan',
    lastName: 'Pérez',
    fullName: 'Juan Pérez',
    programId: '507f1f77bcf86cd799439012',
    externalId: 'ext-001',
    currentSemester: 5,
    email: 'juan.perez@universidad.edu',
    phone: '+57 300 123 4567',
    observations: 'Estudiante destacado',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStudentsService = {
    create: jest.fn().mockResolvedValue(mockStudent),
    findAll: jest.fn().mockResolvedValue([mockStudent]),
    findOne: jest.fn().mockResolvedValue(mockStudent),
    findByCode: jest.fn().mockResolvedValue(mockStudent),
    update: jest.fn().mockResolvedValue({ ...mockStudent, currentSemester: 6 }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
    getStudentSchedule: jest.fn().mockResolvedValue({
      studentCode: 'EST001',
      schedule: [],
    }),
    getStudentAcademicHistory: jest.fn().mockResolvedValue({
      studentCode: 'EST001',
      history: [],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
          useValue: mockStudentsService,
        },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    service = module.get<StudentsService>(StudentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new student', async () => {
      const createDto: CreateStudentDto = {
        code: 'EST001',
        firstName: 'Juan',
        lastName: 'Pérez',
        programId: '507f1f77bcf86cd799439012',
        currentSemester: 1,
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockStudent);
    });

    it('should create a student with optional fields', async () => {
      const createDto: CreateStudentDto = {
        code: 'EST002',
        firstName: 'Maria',
        lastName: 'García',
        programId: '507f1f77bcf86cd799439012',
        email: 'maria.garcia@universidad.edu',
        phone: '+57 300 987 6543',
        currentSemester: 3,
        observations: 'Estudiante de intercambio',
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockStudent);
    });

    it('should create a student with minimal required fields', async () => {
      const createDto: CreateStudentDto = {
        code: 'EST003',
        firstName: 'Carlos',
        lastName: 'Martínez',
        programId: '507f1f77bcf86cd799439012',
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockStudent);
    });
  });

  describe('findAll', () => {
    it('should return an array of students', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockStudent]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no students exist', async () => {
      mockStudentsService.findAll.mockResolvedValueOnce([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single student by ID', async () => {
      const id = '507f1f77bcf86cd799439011';
      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockStudent);
    });

    it('should handle different student IDs', async () => {
      const id = '507f1f77bcf86cd799439099';
      const differentStudent = { ...mockStudent, _id: id, code: 'EST999' };
      mockStudentsService.findOne.mockResolvedValueOnce(differentStudent);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result._id).toBe(id);
    });
  });

  describe('findByCode', () => {
    it('should return a student by code', async () => {
      const studentCode = 'EST001';
      const result = await controller.findByCode(studentCode);

      expect(service.findByCode).toHaveBeenCalledWith(studentCode);
      expect(result).toEqual(mockStudent);
    });

    it('should handle different student codes', async () => {
      const studentCode = 'ENG2024001';
      const differentStudent = { ...mockStudent, code: studentCode };
      mockStudentsService.findByCode.mockResolvedValueOnce(differentStudent);

      const result = await controller.findByCode(studentCode);

      expect(service.findByCode).toHaveBeenCalledWith(studentCode);
      expect(result.code).toBe(studentCode);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateStudentDto = {
        currentSemester: 6,
      };

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual({ ...mockStudent, currentSemester: 6 });
    });

    it('should update student name', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateStudentDto = {
        firstName: 'Juan Carlos',
        lastName: 'Pérez García',
      };

      const updatedStudent = {
        ...mockStudent,
        firstName: 'Juan Carlos',
        lastName: 'Pérez García',
        fullName: 'Juan Carlos Pérez García',
      };
      mockStudentsService.update.mockResolvedValueOnce(updatedStudent);

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result.firstName).toBe('Juan Carlos');
      expect(result.lastName).toBe('Pérez García');
    });

    it('should transfer student to different program', async () => {
      const id = '507f1f77bcf86cd799439011';
      const newProgramId = '507f1f77bcf86cd799439099';
      const updateDto: UpdateStudentDto = {
        programId: newProgramId,
      };

      const updatedStudent = { ...mockStudent, programId: newProgramId };
      mockStudentsService.update.mockResolvedValueOnce(updatedStudent);

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result.programId).toBe(newProgramId);
    });

    it('should update student observations', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateStudentDto = {
        observations: 'Observaciones actualizadas',
      };

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toBeDefined();
    });

    it('should update multiple fields at once', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateStudentDto = {
        currentSemester: 7,
        email: 'nuevo.email@universidad.edu',
        phone: '+57 300 999 8888',
      };

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove a student', async () => {
      const id = '507f1f77bcf86cd799439011';
      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({ deleted: true });
    });

    it('should handle deletion of different students', async () => {
      const id = '507f1f77bcf86cd799439099';
      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toBeDefined();
    });
  });

  describe('getSchedule', () => {
    it('should return student schedule', async () => {
      const studentCode = 'EST001';
      const mockSchedule = {
        studentId: 'EST001',
        schedule: [
          {
            courseCode: 'MAT101',
            courseName: 'Matemáticas I',
            group: 'A',
            schedule: 'Lunes 8:00-10:00',
          },
        ],
      };
      mockStudentsService.getStudentSchedule.mockResolvedValueOnce(mockSchedule);

      const result = await controller.getSchedule(studentCode);

      expect(service.getStudentSchedule).toHaveBeenCalledWith(studentCode);
      expect(result).toEqual(mockSchedule);
    });

    it('should return empty schedule for student with no enrollments', async () => {
      const studentCode = 'EST999';
      const emptySchedule = {
        studentId: 'EST999',
        schedule: [],
      };
      mockStudentsService.getStudentSchedule.mockResolvedValueOnce(emptySchedule);

      const result = await controller.getSchedule(studentCode);

      expect(service.getStudentSchedule).toHaveBeenCalledWith(studentCode);
      expect(result.schedule).toEqual([]);
    });
  });

  describe('getAcademicHistory', () => {
    it('should return student academic history', async () => {
      const studentCode = 'EST001';
      const mockHistory = {
        studentId: 'EST001',
        periods: [
          {
            period: '2024-1',
            courses: [
              { code: 'MAT101', name: 'Matemáticas I', grade: 4.5 },
            ],
          },
        ],
      };
      mockStudentsService.getStudentAcademicHistory.mockResolvedValueOnce(mockHistory);

      const result = await controller.getAcademicHistory(studentCode);

      expect(service.getStudentAcademicHistory).toHaveBeenCalledWith(studentCode);
      expect(result).toEqual(mockHistory);
    });

    it('should return empty history for new student', async () => {
      const studentCode = 'EST999';
      const emptyHistory = {
        studentId: 'EST999',
        periods: [],
      };
      mockStudentsService.getStudentAcademicHistory.mockResolvedValueOnce(emptyHistory);

      const result = await controller.getAcademicHistory(studentCode);

      expect(service.getStudentAcademicHistory).toHaveBeenCalledWith(studentCode);
      expect(result).toBeDefined();
    });
  });

  // Integration scenarios
  describe('Integration: Complete student lifecycle', () => {
    it('should create, retrieve, update and delete a student', async () => {
      const createDto: CreateStudentDto = {
        code: 'EST001',
        firstName: 'Juan',
        lastName: 'Pérez',
        programId: '507f1f77bcf86cd799439012',
        currentSemester: 1,
      };

      // Create
      const created = await controller.create(createDto);
      expect(created).toEqual(mockStudent);

      // Find by ID
      const foundById = await controller.findOne(mockStudent._id as string);
      expect(foundById).toEqual(mockStudent);

      // Find by code
      const foundByCode = await controller.findByCode(mockStudent.code);
      expect(foundByCode).toEqual(mockStudent);

      // Update
      const updateDto: UpdateStudentDto = { currentSemester: 6 };
      const updated = await controller.update(mockStudent._id as string, updateDto);
      expect(updated).toBeDefined();

      // Delete
      const deleted = await controller.remove(mockStudent._id as string);
      expect(deleted).toEqual({ deleted: true });
    });
  });

  describe('Integration: Student academic tracking', () => {
    it('should track student through enrollment and schedule', async () => {
      const studentCode = 'EST001';

      // Get student by code
      const student = await controller.findByCode(studentCode);
      expect(student.code).toBe(studentCode);

      // Get schedule
      const schedule = await controller.getSchedule(studentCode);
      expect(schedule).toBeDefined();

      // Get academic history
      const history = await controller.getAcademicHistory(studentCode);
      expect(history).toBeDefined();
    });
  });

  describe('Integration: Student progression workflow', () => {
    it('should manage student semester progression', async () => {
      const studentId = mockStudent._id as string;

      // Initial state
      const student = await controller.findOne(studentId);
      expect(student.currentSemester).toBe(5);

      // Advance to next semester
      const updateDto: UpdateStudentDto = { currentSemester: 6 };
      const updated = await controller.update(studentId, updateDto);
      expect(updated.currentSemester).toBe(6);

      // Verify update
      expect(service.update).toHaveBeenCalledWith(studentId, updateDto);
    });
  });

  describe('Integration: Student program transfer', () => {
    it('should transfer student between programs', async () => {
      const studentId = mockStudent._id as string;
      const originalProgramId = mockStudent.programId;
      const newProgramId = '507f1f77bcf86cd799439099';

      // Initial state
      const student = await controller.findOne(studentId);
      expect(student.programId).toBe(originalProgramId);

      // Transfer to new program
      const updateDto: UpdateStudentDto = {
        programId: newProgramId,
        currentSemester: 1, // Reset semester for new program
      };

      const transferredStudent = {
        ...mockStudent,
        programId: newProgramId,
        currentSemester: 1,
      };
      mockStudentsService.update.mockResolvedValueOnce(transferredStudent);

      const updated = await controller.update(studentId, updateDto);
      expect(updated.programId).toBe(newProgramId);
      expect(updated.currentSemester).toBe(1);
    });
  });
});
