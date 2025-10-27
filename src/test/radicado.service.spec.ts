import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { RadicadoService } from '../common/services/radicado.service';
import {
  RadicadoCounter,
  RadicadoCounterDocument,
} from '../common/entities/radicado-counter.entity';

describe('RadicadoService', () => {
  let service: RadicadoService;
  let radicadoCounterModel: Model<RadicadoCounterDocument>;

  const mockRadicadoCounterModel = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RadicadoService,
        {
          provide: getModelToken(RadicadoCounter.name),
          useValue: mockRadicadoCounterModel,
        },
      ],
    }).compile();

    service = module.get<RadicadoService>(RadicadoService);
    radicadoCounterModel = module.get<Model<RadicadoCounterDocument>>(
      getModelToken(RadicadoCounter.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRadicado', () => {
    it('should generate radicado with correct format for current year', async () => {
      const currentYear = new Date().getFullYear();
      const mockCounter = {
        year: currentYear,
        sequence: 1,
      };

      (radicadoCounterModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockCounter);

      const result = await service.generateRadicado();

      expect(result).toBe(`${currentYear}-000001`);
      expect(radicadoCounterModel.findOneAndUpdate).toHaveBeenCalledWith(
        { year: currentYear },
        { $inc: { sequence: 1 } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    });

    it('should pad sequence number with leading zeros', async () => {
      const currentYear = new Date().getFullYear();
      const mockCounter = {
        year: currentYear,
        sequence: 42,
      };

      (radicadoCounterModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockCounter);

      const result = await service.generateRadicado();

      expect(result).toBe(`${currentYear}-000042`);
    });

    it('should handle large sequence numbers correctly', async () => {
      const currentYear = new Date().getFullYear();
      const mockCounter = {
        year: currentYear,
        sequence: 123456,
      };

      (radicadoCounterModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockCounter);

      const result = await service.generateRadicado();

      expect(result).toBe(`${currentYear}-123456`);
    });

    it('should retry on failure and eventually succeed', async () => {
      const currentYear = new Date().getFullYear();
      const mockCounter = {
        year: currentYear,
        sequence: 5,
      };

      (radicadoCounterModel.findOneAndUpdate as jest.Mock)
        .mockRejectedValueOnce(new Error('Database connection error'))
        .mockResolvedValueOnce(mockCounter);

      const result = await service.generateRadicado();

      expect(result).toBe(`${currentYear}-000005`);
      expect(radicadoCounterModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('should throw InternalServerErrorException after max retries', async () => {
      const error = new Error('Persistent database error');
      
      (radicadoCounterModel.findOneAndUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.generateRadicado()).rejects.toThrow(InternalServerErrorException);
      await expect(service.generateRadicado()).rejects.toThrow(
        /No se pudo generar el radicado después de \d+ intentos/,
      );

      expect(radicadoCounterModel.findOneAndUpdate).toHaveBeenCalledTimes(6); // 3 retries x 2 calls
    });

    it('should use atomic increment operation', async () => {
      const currentYear = new Date().getFullYear();
      const mockCounter = {
        year: currentYear,
        sequence: 100,
      };

      (radicadoCounterModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockCounter);

      await service.generateRadicado();

      expect(radicadoCounterModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        { $inc: { sequence: 1 } },
        expect.anything(),
      );
    });
  });

  describe('getLastRadicado', () => {
    it('should return last radicado for current year', async () => {
      const currentYear = new Date().getFullYear();
      const mockCounter = {
        year: currentYear,
        sequence: 42,
      };

      (radicadoCounterModel.findOne as jest.Mock).mockResolvedValue(mockCounter);

      const result = await service.getLastRadicado();

      expect(result).toBe(`${currentYear}-000042`);
      expect(radicadoCounterModel.findOne).toHaveBeenCalledWith({ year: currentYear });
    });

    it('should return last radicado for specified year', async () => {
      const year = 2023;
      const mockCounter = {
        year: 2023,
        sequence: 156,
      };

      (radicadoCounterModel.findOne as jest.Mock).mockResolvedValue(mockCounter);

      const result = await service.getLastRadicado(year);

      expect(result).toBe('2023-000156');
      expect(radicadoCounterModel.findOne).toHaveBeenCalledWith({ year: 2023 });
    });

    it('should return null when no radicados exist for year', async () => {
      (radicadoCounterModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getLastRadicado();

      expect(result).toBeNull();
    });

    it('should return null when sequence is zero', async () => {
      const currentYear = new Date().getFullYear();
      const mockCounter = {
        year: currentYear,
        sequence: 0,
      };

      (radicadoCounterModel.findOne as jest.Mock).mockResolvedValue(mockCounter);

      const result = await service.getLastRadicado();

      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      (radicadoCounterModel.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getLastRadicado()).rejects.toThrow(InternalServerErrorException);
      await expect(service.getLastRadicado()).rejects.toThrow(
        'Error al consultar el último radicado',
      );
    });
  });

  describe('getRadicadoStats', () => {
    it('should return statistics for all years', async () => {
      const mockStats = [
        { year: 2024, sequence: 500 },
        { year: 2023, sequence: 450 },
        { year: 2022, sequence: 400 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStats),
      };

      (radicadoCounterModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.getRadicadoStats();

      expect(result).toEqual([
        { year: 2024, count: 500 },
        { year: 2023, count: 450 },
        { year: 2022, count: 400 },
      ]);
      expect(radicadoCounterModel.find).toHaveBeenCalledWith(
        {},
        { year: 1, sequence: 1, _id: 0 },
      );
      expect(mockQuery.sort).toHaveBeenCalledWith({ year: -1 });
    });

    it('should return empty array when no statistics exist', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (radicadoCounterModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.getRadicadoStats();

      expect(result).toEqual([]);
    });

    it('should sort statistics by year descending', async () => {
      const mockStats = [
        { year: 2024, sequence: 100 },
        { year: 2023, sequence: 200 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStats),
      };

      (radicadoCounterModel.find as jest.Mock).mockReturnValue(mockQuery);

      await service.getRadicadoStats();

      expect(mockQuery.sort).toHaveBeenCalledWith({ year: -1 });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (radicadoCounterModel.find as jest.Mock).mockReturnValue(mockQuery);

      await expect(service.getRadicadoStats()).rejects.toThrow(InternalServerErrorException);
      await expect(service.getRadicadoStats()).rejects.toThrow(
        'Error al consultar estadísticas de radicados',
      );
    });

    it('should transform sequence to count in results', async () => {
      const mockStats = [
        { year: 2024, sequence: 999 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStats),
      };

      (radicadoCounterModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.getRadicadoStats();

      expect(result[0]).toHaveProperty('count', 999);
      expect(result[0]).not.toHaveProperty('sequence');
    });
  });

  describe('Edge Cases', () => {
    it('should handle year transition correctly', async () => {
      const currentYear = new Date().getFullYear();
      const mockCounter = {
        year: currentYear,
        sequence: 1000,
      };

      (radicadoCounterModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockCounter);

      const result = await service.generateRadicado();

      expect(result).toMatch(/^\d{4}-\d{6}$/);
      expect(result).toBe(`${currentYear}-001000`);
    });

    it('should handle concurrent radicado generation', async () => {
      const mockCounters = [
        { year: 2024, sequence: 1 },
        { year: 2024, sequence: 2 },
        { year: 2024, sequence: 3 },
      ];

      let callCount = 0;
      (radicadoCounterModel.findOneAndUpdate as jest.Mock).mockImplementation(() => {
        return Promise.resolve(mockCounters[callCount++]);
      });

      const results = await Promise.all([
        service.generateRadicado(),
        service.generateRadicado(),
        service.generateRadicado(),
      ]);

      expect(results).toHaveLength(3);
      expect(new Set(results).size).toBe(3); // All unique
    });
  });
});
