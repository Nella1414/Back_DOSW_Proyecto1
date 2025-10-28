import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoutingService, RoutingContext } from '../common/services/routing.service';
import { ProgramCourse, ProgramCourseDocument } from '../programs/entities/program.entity';
import { Student, StudentDocument } from '../students/entities/student.entity';

describe('RoutingService', () => {
  let service: RoutingService;
  let programCourseModel: Model<ProgramCourseDocument>;
  let studentModel: Model<StudentDocument>;

  const mockUserId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockSourceSubjectId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockTargetSubjectId = '60d5ecb8b0a7c4b4b8b9b1a3';
  const mockProgramId1 = '60d5ecb8b0a7c4b4b8b9b1a4';
  const mockProgramId2 = '60d5ecb8b0a7c4b4b8b9b1a5';
  const mockStudentProgramId = '60d5ecb8b0a7c4b4b8b9b1a6';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        {
          provide: getModelToken(ProgramCourse.name),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getModelToken(Student.name),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
    programCourseModel = module.get<Model<ProgramCourseDocument>>(
      getModelToken(ProgramCourse.name),
    );
    studentModel = module.get<Model<StudentDocument>>(getModelToken(Student.name));
  });

  describe('determineProgram', () => {
    it('should assign to same program when both subjects belong to same program (Rule 1)', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentProgramId: mockStudentProgramId, // Proveer para evitar llamada a BD
      };

      // Mock para ambas materias pertenecen al mismo programa
      jest.spyOn(programCourseModel, 'findOne').mockImplementation((query: any) => {
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              courseId: query.courseId,
              programId: mockProgramId1,
            }),
          }),
        } as any;
      });

      const result = await service.determineProgram(context);

      expect(result.assignedProgramId).toBe(mockProgramId1);
      expect(result.rule).toBe('SAME_PROGRAM');
      expect(result.reason).toContain('Ambas materias pertenecen al programa');
    });

    it('should assign to target program when subjects from different programs (Rule 2)', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentProgramId: mockStudentProgramId, // Proveer para evitar llamada a BD
      };

      let callCount = 0;
      jest.spyOn(programCourseModel, 'findOne').mockImplementation((query: any) => {
        callCount++;
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              courseId: query.courseId,
              programId: callCount === 1 ? mockProgramId1 : mockProgramId2,
            }),
          }),
        } as any;
      });

      const result = await service.determineProgram(context);

      expect(result.assignedProgramId).toBe(mockProgramId2);
      expect(result.rule).toBe('TARGET_PROGRAM');
      expect(result.reason).toContain('Materias de diferentes programas');
    });

    it('should assign to source program when only source has program (Rule 3)', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentProgramId: mockStudentProgramId,
      };

      let callCount = 0;
      jest.spyOn(programCourseModel, 'findOne').mockImplementation((query: any) => {
        callCount++;
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(
              callCount === 1
                ? { courseId: query.courseId, programId: mockProgramId1 }
                : null,
            ),
          }),
        } as any;
      });

      const result = await service.determineProgram(context);

      expect(result.assignedProgramId).toBe(mockProgramId1);
      expect(result.rule).toBe('SOURCE_PROGRAM');
      expect(result.reason).toContain('Solo materia origen tiene programa');
    });

    it('should assign to target program when only target has program (Rule 4)', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentProgramId: mockStudentProgramId,
      };

      let callCount = 0;
      jest.spyOn(programCourseModel, 'findOne').mockImplementation((query: any) => {
        callCount++;
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(
              callCount === 2
                ? { courseId: query.courseId, programId: mockProgramId2 }
                : null,
            ),
          }),
        } as any;
      });

      const result = await service.determineProgram(context);

      expect(result.assignedProgramId).toBe(mockProgramId2);
      expect(result.rule).toBe('TARGET_PROGRAM');
      expect(result.reason).toContain('Solo materia destino tiene programa');
    });

    it('should fallback to student program when no subjects have programs', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
      };

      // Mock para ninguna materia tiene programa
      jest.spyOn(programCourseModel, 'findOne').mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        } as any;
      });

      // Mock para estudiante
      jest.spyOn(studentModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            externalId: mockUserId,
            programId: mockStudentProgramId,
          }),
        }),
      } as any);

      const result = await service.determineProgram(context);

      expect(result.assignedProgramId).toBe(mockStudentProgramId);
      expect(result.rule).toBe('STUDENT_PROGRAM');
      expect(result.reason).toContain('Fallback al programa del estudiante');
    });

    it('should use provided studentProgramId when available', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentProgramId: mockStudentProgramId,
      };

      // Mock para ninguna materia tiene programa
      jest.spyOn(programCourseModel, 'findOne').mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        } as any;
      });

      const result = await service.determineProgram(context);

      expect(result.assignedProgramId).toBe(mockStudentProgramId);
      expect(result.rule).toBe('STUDENT_PROGRAM');
      // No debe llamar a la BD para obtener el programa del estudiante
      expect(studentModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw error when student not found', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
      };

      // Mock para ninguna materia tiene programa
      jest.spyOn(programCourseModel, 'findOne').mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        } as any;
      });

      // Mock para estudiante no encontrado
      jest.spyOn(studentModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      await expect(service.determineProgram(context)).rejects.toThrow(
        'No se pudo determinar el programa para la solicitud',
      );
    });

    it('should throw error when student has no program', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
      };

      // Mock para ninguna materia tiene programa
      jest.spyOn(programCourseModel, 'findOne').mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        } as any;
      });

      // Mock para estudiante sin programa
      jest.spyOn(studentModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            externalId: mockUserId,
            programId: null,
          }),
        }),
      } as any);

      await expect(service.determineProgram(context)).rejects.toThrow(
        'No se pudo determinar el programa para la solicitud',
      );
    });

    it('should handle database errors gracefully', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
      };

      jest.spyOn(programCourseModel, 'findOne').mockImplementation(() => {
        throw new Error('Database connection error');
      });

      await expect(service.determineProgram(context)).rejects.toThrow(
        'No se pudo determinar el programa para la solicitud',
      );
    });
  });

  describe('validateProgram', () => {
    it('should return true when program exists and is active', async () => {
      jest.spyOn(programCourseModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          programId: mockProgramId1,
          isActive: true,
        }),
      } as any);

      const result = await service.validateProgram(mockProgramId1);

      expect(result).toBe(true);
      expect(programCourseModel.findOne).toHaveBeenCalledWith({
        programId: mockProgramId1,
        isActive: true,
      });
    });

    it('should return false when program not found', async () => {
      jest.spyOn(programCourseModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.validateProgram('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when program is inactive', async () => {
      jest.spyOn(programCourseModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.validateProgram(mockProgramId1);

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      jest.spyOn(programCourseModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      const result = await service.validateProgram(mockProgramId1);

      expect(result).toBe(false);
    });
  });

  describe('getRoutingStats', () => {
    it('should return all routing rules descriptions', () => {
      const stats = service.getRoutingStats();

      expect(stats).toHaveProperty('SAME_PROGRAM');
      expect(stats).toHaveProperty('TARGET_PROGRAM');
      expect(stats).toHaveProperty('SOURCE_PROGRAM');
      expect(stats).toHaveProperty('STUDENT_PROGRAM');
      expect(Object.keys(stats)).toHaveLength(4);
    });

    it('should have correct descriptions for each rule', () => {
      const stats = service.getRoutingStats();

      expect(stats['SAME_PROGRAM']).toBe('Ambas materias del mismo programa');
      expect(stats['TARGET_PROGRAM']).toBe('Programa de materia destino');
      expect(stats['SOURCE_PROGRAM']).toBe('Programa de materia origen');
      expect(stats['STUDENT_PROGRAM']).toBe('Programa del estudiante (fallback)');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete routing workflow', async () => {
      const context: RoutingContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentProgramId: mockStudentProgramId, // Proveer para evitar llamada a BD
      };

      jest.spyOn(programCourseModel, 'findOne').mockImplementation((query: any) => {
        // Si el query tiene populate (llamada para determinar programa de materias)
        if (query.courseId) {
          return {
            populate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({
                courseId: query.courseId,
                programId: mockProgramId1,
              }),
            }),
          } as any;
        }
        // Si el query es para validateProgram
        return {
          exec: jest.fn().mockResolvedValue({
            programId: mockProgramId1,
            isActive: true,
          }),
        } as any;
      });

      const decision = await service.determineProgram(context);
      const isValid = await service.validateProgram(decision.assignedProgramId);

      expect(decision.assignedProgramId).toBe(mockProgramId1);
      expect(isValid).toBe(true);
    });

    it('should handle all routing rules systematically', async () => {
      const stats = service.getRoutingStats();
      const rules = Object.keys(stats);

      expect(rules).toContain('SAME_PROGRAM');
      expect(rules).toContain('TARGET_PROGRAM');
      expect(rules).toContain('SOURCE_PROGRAM');
      expect(rules).toContain('STUDENT_PROGRAM');
    });
  });
});
