import { Test, TestingModule } from '@nestjs/testing';
import {
  PriorityCalculatorService,
  Priority,
  PriorityContext,
  AddDropPeriodConfig,
} from '../common/services/priority-calculator.service';

describe('PriorityCalculatorService', () => {
  let service: PriorityCalculatorService;

  const mockUserId = '60d5ecb8b0a7c4b4b8b9b1a1';
  const mockSourceSubjectId = '60d5ecb8b0a7c4b4b8b9b1a2';
  const mockTargetSubjectId = '60d5ecb8b0a7c4b4b8b9b1a3';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriorityCalculatorService],
    }).compile();

    service = module.get<PriorityCalculatorService>(PriorityCalculatorService);
  });

  describe('calculatePriority', () => {
    it('should return NORMAL priority by default', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
      };

      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.NORMAL);
    });

    it('should return HIGH priority for students in semester 10 or above', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentSemester: 10,
      };

      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.HIGH);
    });

    it('should return HIGH priority for mandatory target subject', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        isTargetMandatory: true,
      };

      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.HIGH);
    });

    it('should return LOW priority during add/drop period', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        isAddDropPeriod: true,
      };

      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.LOW);
    });

    it('should return URGENT priority for senior students with mandatory subject', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentSemester: 11,
        isTargetMandatory: true,
      };

      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.URGENT);
    });

    it('should return HIGH priority for senior students even without mandatory flag', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentSemester: 12,
        isTargetMandatory: false,
      };

      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.HIGH);
    });

    it('should prioritize URGENT over add/drop period reduction', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentSemester: 10,
        isTargetMandatory: true,
        isAddDropPeriod: true,
      };

      const result = service.calculatePriority(context);

      // La lógica del servicio primero evalúa add/drop (LOW), pero luego 
      // los criterios de estudiante avanzado + obligatoria lo elevan a URGENT
      expect(result).toBe(Priority.URGENT);
    });

    it('should handle students below semester 10 as NORMAL', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentSemester: 5,
      };

      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.NORMAL);
    });

    it('should return NORMAL on calculation error', () => {
      // Usar un contexto con datos malformados que cause error en la lógica
      const context: any = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentSemester: 'invalid' as any, // Tipo inválido que causará error en comparación
      };

      // El servicio tiene try-catch y retorna NORMAL en caso de error
      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.NORMAL);
    });

    it('should handle edge case: semester exactly 10', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentSemester: 10,
      };

      const result = service.calculatePriority(context);

      expect(result).toBe(Priority.HIGH);
    });
  });

  describe('getPriorityDescription', () => {
    it('should return correct description for LOW priority', () => {
      const result = service.getPriorityDescription(Priority.LOW);

      expect(result).toBe('Prioridad baja - Periodo add/drop o electivas');
    });

    it('should return correct description for NORMAL priority', () => {
      const result = service.getPriorityDescription(Priority.NORMAL);

      expect(result).toBe('Prioridad normal - Solicitud estándar');
    });

    it('should return correct description for HIGH priority', () => {
      const result = service.getPriorityDescription(Priority.HIGH);

      expect(result).toBe('Prioridad alta - Materia obligatoria o estudiante avanzado');
    });

    it('should return correct description for URGENT priority', () => {
      const result = service.getPriorityDescription(Priority.URGENT);

      expect(result).toBe(
        'Prioridad urgente - Estudiante próximo a graduar con materia obligatoria',
      );
    });
  });

  describe('getPriorityWeight', () => {
    it('should return weight 1 for LOW priority', () => {
      const result = service.getPriorityWeight(Priority.LOW);

      expect(result).toBe(1);
    });

    it('should return weight 2 for NORMAL priority', () => {
      const result = service.getPriorityWeight(Priority.NORMAL);

      expect(result).toBe(2);
    });

    it('should return weight 3 for HIGH priority', () => {
      const result = service.getPriorityWeight(Priority.HIGH);

      expect(result).toBe(3);
    });

    it('should return weight 4 for URGENT priority', () => {
      const result = service.getPriorityWeight(Priority.URGENT);

      expect(result).toBe(4);
    });

    it('should allow sorting by priority weight', () => {
      const priorities = [Priority.LOW, Priority.URGENT, Priority.NORMAL, Priority.HIGH];

      const sorted = priorities.sort(
        (a, b) => service.getPriorityWeight(b) - service.getPriorityWeight(a),
      );

      expect(sorted).toEqual([Priority.URGENT, Priority.HIGH, Priority.NORMAL, Priority.LOW]);
    });
  });

  describe('isAddDropPeriod', () => {
    it('should return true for date in first add/drop period (days 15-29)', () => {
      // Día 20 del año (20 de enero aproximadamente)
      const date = new Date(2024, 0, 20); // Enero 20

      const result = service.isAddDropPeriod(date);

      expect(result).toBe(true);
    });

    it('should return true for date in second add/drop period (days 195-209)', () => {
      // Día 200 del año (julio aproximadamente)
      const date = new Date(2024, 6, 18); // Julio 18 = día ~200

      const result = service.isAddDropPeriod(date);

      expect(result).toBe(true);
    });

    it('should return false for date outside add/drop periods', () => {
      // Marzo (día ~60-90)
      const date = new Date(2024, 2, 15); // Marzo 15

      const result = service.isAddDropPeriod(date);

      expect(result).toBe(false);
    });

    it('should return false for date at boundary before period', () => {
      // Día 14 (fuera del primer periodo)
      const date = new Date(2024, 0, 14); // Enero 14

      const result = service.isAddDropPeriod(date);

      expect(result).toBe(false);
    });

    it('should return false for date at boundary after period', () => {
      // Día 30 (fuera del primer periodo)
      const date = new Date(2024, 0, 30); // Enero 30

      const result = service.isAddDropPeriod(date);

      expect(result).toBe(false);
    });

    it('should use current date when no date provided', () => {
      const result = service.isAddDropPeriod();

      expect(typeof result).toBe('boolean');
    });

    it('should return false on error', () => {
      const invalidDate = new Date('invalid');

      const result = service.isAddDropPeriod(invalidDate);

      expect(result).toBe(false);
    });

    it('should handle leap year correctly', () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024 (leap year)

      const result = service.isAddDropPeriod(date);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('setAddDropPeriods', () => {
    it('should update add/drop periods correctly', () => {
      const newPeriods: AddDropPeriodConfig[] = [
        { startDay: 10, endDay: 20 },
        { startDay: 180, endDay: 190 },
      ];

      service.setAddDropPeriods(newPeriods);

      const periods = service.getAddDropPeriods();
      expect(periods).toEqual(newPeriods);
    });

    it('should replace existing periods completely', () => {
      const newPeriods: AddDropPeriodConfig[] = [{ startDay: 100, endDay: 110 }];

      service.setAddDropPeriods(newPeriods);

      const periods = service.getAddDropPeriods();
      expect(periods).toHaveLength(1);
      expect(periods[0]).toEqual({ startDay: 100, endDay: 110 });
    });

    it('should throw error for invalid period (startDay < 1)', () => {
      const invalidPeriods: AddDropPeriodConfig[] = [{ startDay: 0, endDay: 10 }];

      expect(() => service.setAddDropPeriods(invalidPeriods)).toThrow();
    });

    it('should throw error for invalid period (endDay > 366)', () => {
      const invalidPeriods: AddDropPeriodConfig[] = [{ startDay: 100, endDay: 367 }];

      expect(() => service.setAddDropPeriods(invalidPeriods)).toThrow();
    });

    it('should throw error for invalid period (startDay > endDay)', () => {
      const invalidPeriods: AddDropPeriodConfig[] = [{ startDay: 50, endDay: 40 }];

      expect(() => service.setAddDropPeriods(invalidPeriods)).toThrow(/Periodo inválido/);
    });

    it('should validate all periods before applying changes', () => {
      const mixedPeriods: AddDropPeriodConfig[] = [
        { startDay: 10, endDay: 20 },
        { startDay: 200, endDay: 100 }, // Invalid
      ];

      expect(() => service.setAddDropPeriods(mixedPeriods)).toThrow();
    });

    it('should accept empty array', () => {
      service.setAddDropPeriods([]);

      const periods = service.getAddDropPeriods();
      expect(periods).toHaveLength(0);
    });

    it('should accept multiple valid periods', () => {
      const periods: AddDropPeriodConfig[] = [
        { startDay: 1, endDay: 10 },
        { startDay: 50, endDay: 60 },
        { startDay: 100, endDay: 110 },
      ];

      service.setAddDropPeriods(periods);

      const result = service.getAddDropPeriods();
      expect(result).toHaveLength(3);
    });
  });

  describe('getAddDropPeriods', () => {
    it('should return default periods initially', () => {
      const periods = service.getAddDropPeriods();

      expect(periods).toHaveLength(2);
      expect(periods[0]).toEqual({ startDay: 15, endDay: 29 });
      expect(periods[1]).toEqual({ startDay: 195, endDay: 209 });
    });

    it('should return copy of periods (not original array)', () => {
      const periods1 = service.getAddDropPeriods();
      const periods2 = service.getAddDropPeriods();

      expect(periods1).not.toBe(periods2); // Different array instances
      expect(periods1).toEqual(periods2); // Same content
    });

    it('should not allow external modification', () => {
      const periods = service.getAddDropPeriods();
      periods.push({ startDay: 300, endDay: 310 });

      const freshPeriods = service.getAddDropPeriods();
      expect(freshPeriods).toHaveLength(2); // Original length preserved
    });
  });

  describe('Integration scenarios', () => {
    it('should calculate priority and provide full context', () => {
      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        studentSemester: 11,
        isTargetMandatory: true,
        isAddDropPeriod: false,
        requestDate: new Date(),
      };

      const priority = service.calculatePriority(context);
      const description = service.getPriorityDescription(priority);
      const weight = service.getPriorityWeight(priority);

      expect(priority).toBe(Priority.URGENT);
      expect(description).toContain('urgente');
      expect(weight).toBe(4);
    });

    it('should handle complex priority scenario with add/drop override', () => {
      // Configurar periodo add/drop que incluya hoy
      const today = new Date();
      const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      service.setAddDropPeriods([{ startDay: dayOfYear - 1, endDay: dayOfYear + 1 }]);

      const isInPeriod = service.isAddDropPeriod();
      expect(isInPeriod).toBe(true);

      const context: PriorityContext = {
        userId: mockUserId,
        sourceSubjectId: mockSourceSubjectId,
        targetSubjectId: mockTargetSubjectId,
        isAddDropPeriod: isInPeriod,
      };

      const priority = service.calculatePriority(context);
      expect(priority).toBe(Priority.LOW);
    });

    it('should support multiple requests with different contexts', () => {
      const contexts: PriorityContext[] = [
        {
          userId: 'user1',
          sourceSubjectId: mockSourceSubjectId,
          targetSubjectId: mockTargetSubjectId,
          studentSemester: 5,
        },
        {
          userId: 'user2',
          sourceSubjectId: mockSourceSubjectId,
          targetSubjectId: mockTargetSubjectId,
          studentSemester: 10,
          isTargetMandatory: true,
        },
        {
          userId: 'user3',
          sourceSubjectId: mockSourceSubjectId,
          targetSubjectId: mockTargetSubjectId,
          isAddDropPeriod: true,
        },
      ];

      const priorities = contexts.map((ctx) => service.calculatePriority(ctx));

      expect(priorities[0]).toBe(Priority.NORMAL);
      expect(priorities[1]).toBe(Priority.URGENT);
      expect(priorities[2]).toBe(Priority.LOW);
    });
  });
});
