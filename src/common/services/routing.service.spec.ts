import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoutingService } from './routing.service';
import { ProgramCourse } from '../../programs/entities/program.entity';
import { Student } from '../../students/entities/student.entity';

describe('RoutingService', () => {
  let service: RoutingService;
  let programCourseModel: Model<ProgramCourse>;
  let studentModel: Model<Student>;

  const mockProgramCourseModel = {
    findOne: jest.fn(),
  };

  const mockStudentModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        {
          provide: getModelToken(ProgramCourse.name),
          useValue: mockProgramCourseModel,
        },
        {
          provide: getModelToken(Student.name),
          useValue: mockStudentModel,
        },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
    programCourseModel = module.get<Model<ProgramCourse>>(getModelToken(ProgramCourse.name));
    studentModel = module.get<Model<Student>>(getModelToken(Student.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('determineProgram', () => {
    it('debe asignar al mismo programa cuando ambas materias pertenecen a él (SAME_PROGRAM)', async () => {
      mockProgramCourseModel.findOne
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ programId: 'PROG-CS' }),
          }),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ programId: 'PROG-CS' }),
          }),
        });

      const result = await service.determineProgram({
        userId: 'user123',
        sourceSubjectId: 'course1',
        targetSubjectId: 'course2',
        studentProgramId: 'PROG-ING',
      });

      expect(result.assignedProgramId).toBe('PROG-CS');
      expect(result.rule).toBe('SAME_PROGRAM');
      expect(result.reason).toContain('Ambas materias pertenecen al programa');
    });

    it('debe asignar al programa de destino cuando son diferentes (TARGET_PROGRAM)', async () => {
      mockProgramCourseModel.findOne
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ programId: 'PROG-CS' }),
          }),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ programId: 'PROG-ING' }),
          }),
        });

      const result = await service.determineProgram({
        userId: 'user123',
        sourceSubjectId: 'course1',
        targetSubjectId: 'course2',
        studentProgramId: 'PROG-MAT',
      });

      expect(result.assignedProgramId).toBe('PROG-ING');
      expect(result.rule).toBe('TARGET_PROGRAM');
      expect(result.reason).toContain('diferentes programas');
    });

    it('debe usar programa de origen cuando solo origen tiene programa (SOURCE_PROGRAM)', async () => {
      mockProgramCourseModel.findOne
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ programId: 'PROG-CS' }),
          }),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        });

      const result = await service.determineProgram({
        userId: 'user123',
        sourceSubjectId: 'course1',
        targetSubjectId: 'course2',
        studentProgramId: 'PROG-ING',
      });

      expect(result.assignedProgramId).toBe('PROG-CS');
      expect(result.rule).toBe('SOURCE_PROGRAM');
      expect(result.reason).toContain('Solo materia origen');
    });

    it('debe usar programa de destino cuando solo destino tiene programa (TARGET_PROGRAM)', async () => {
      mockProgramCourseModel.findOne
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ programId: 'PROG-MAT' }),
          }),
        });

      const result = await service.determineProgram({
        userId: 'user123',
        sourceSubjectId: 'course1',
        targetSubjectId: 'course2',
        studentProgramId: 'PROG-ING',
      });

      expect(result.assignedProgramId).toBe('PROG-MAT');
      expect(result.rule).toBe('TARGET_PROGRAM');
      expect(result.reason).toContain('Solo materia destino');
    });

    it('debe usar programa del estudiante como fallback (STUDENT_PROGRAM)', async () => {
      mockProgramCourseModel.findOne
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        });

      mockStudentModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ programId: 'PROG-ADMIN' }),
        }),
      });

      const result = await service.determineProgram({
        userId: 'user123',
        sourceSubjectId: 'course1',
        targetSubjectId: 'course2',
      });

      expect(result.assignedProgramId).toBe('PROG-ADMIN');
      expect(result.rule).toBe('STUDENT_PROGRAM');
      expect(result.reason).toContain('Fallback al programa del estudiante');
    });

    it('debe lanzar error si el estudiante no existe', async () => {
      mockProgramCourseModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      mockStudentModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.determineProgram({
          userId: 'user123',
          sourceSubjectId: 'course1',
          targetSubjectId: 'course2',
        })
      ).rejects.toThrow('no tiene programa asignado');
    });

    it('debe manejar errores de base de datos', async () => {
      mockProgramCourseModel.findOne.mockImplementation(() => {
        throw new Error('Database connection error');
      });

      await expect(
        service.determineProgram({
          userId: 'user123',
          sourceSubjectId: 'course1',
          targetSubjectId: 'course2',
        })
      ).rejects.toThrow('No se pudo determinar el programa');
    });
  });

  describe('getRoutingStats', () => {
    it('debe retornar estadísticas de ruteo', () => {
      const stats = service.getRoutingStats();

      expect(stats).toHaveProperty('SAME_PROGRAM');
      expect(stats).toHaveProperty('TARGET_PROGRAM');
      expect(stats).toHaveProperty('SOURCE_PROGRAM');
      expect(stats).toHaveProperty('STUDENT_PROGRAM');
    });
  });
});
