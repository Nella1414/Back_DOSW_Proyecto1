import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RadicadoService } from './radicado.service';
import { RadicadoCounter } from '../entities/radicado-counter.entity';
import { InternalServerErrorException } from '@nestjs/common';

describe('RadicadoService', () => {
  let service: RadicadoService;
  let model: Model<RadicadoCounter>;

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
    model = module.get<Model<RadicadoCounter>>(
      getModelToken(RadicadoCounter.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRadicado', () => {
    it('debe generar radicado con formato YYYY-NNNNNN', async () => {
      const currentYear = new Date().getFullYear();
      mockRadicadoCounterModel.findOneAndUpdate.mockResolvedValue({
        year: currentYear,
        sequence: 1,
      });

      const radicado = await service.generateRadicado();

      expect(radicado).toBe(`${currentYear}-000001`);
      expect(mockRadicadoCounterModel.findOneAndUpdate).toHaveBeenCalledWith(
        { year: currentYear },
        { $inc: { sequence: 1 } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    });

    it('debe generar radicados secuenciales', async () => {
      const currentYear = new Date().getFullYear();
      mockRadicadoCounterModel.findOneAndUpdate
        .mockResolvedValueOnce({ year: currentYear, sequence: 1 })
        .mockResolvedValueOnce({ year: currentYear, sequence: 2 })
        .mockResolvedValueOnce({ year: currentYear, sequence: 3 });

      const radicado1 = await service.generateRadicado();
      const radicado2 = await service.generateRadicado();
      const radicado3 = await service.generateRadicado();

      expect(radicado1).toBe(`${currentYear}-000001`);
      expect(radicado2).toBe(`${currentYear}-000002`);
      expect(radicado3).toBe(`${currentYear}-000003`);
    });

    it('debe reintentar hasta 3 veces en caso de error', async () => {
      mockRadicadoCounterModel.findOneAndUpdate
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce({ year: 2025, sequence: 1 });

      const radicado = await service.generateRadicado();

      expect(radicado).toBe('2025-000001');
      expect(mockRadicadoCounterModel.findOneAndUpdate).toHaveBeenCalledTimes(
        3,
      );
    });

    it('debe lanzar InternalServerErrorException después de 3 intentos fallidos', async () => {
      mockRadicadoCounterModel.findOneAndUpdate.mockRejectedValue(
        new Error('Connection error'),
      );

      await expect(service.generateRadicado()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockRadicadoCounterModel.findOneAndUpdate).toHaveBeenCalledTimes(
        3,
      );
    });

    it('debe lanzar error si counter es null', async () => {
      mockRadicadoCounterModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.generateRadicado()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('debe formatear correctamente números grandes', async () => {
      const currentYear = new Date().getFullYear();
      mockRadicadoCounterModel.findOneAndUpdate.mockResolvedValue({
        year: currentYear,
        sequence: 999999,
      });

      const radicado = await service.generateRadicado();

      expect(radicado).toBe(`${currentYear}-999999`);
    });
  });

  describe('getLastRadicado', () => {
    it('debe obtener el último radicado del año actual', async () => {
      const currentYear = new Date().getFullYear();
      mockRadicadoCounterModel.findOne.mockResolvedValue({
        year: currentYear,
        sequence: 42,
      });

      const lastRadicado = await service.getLastRadicado();

      expect(lastRadicado).toBe(`${currentYear}-000042`);
      expect(mockRadicadoCounterModel.findOne).toHaveBeenCalledWith({
        year: currentYear,
      });
    });

    it('debe retornar null si no hay radicados', async () => {
      mockRadicadoCounterModel.findOne.mockResolvedValue(null);

      const lastRadicado = await service.getLastRadicado();

      expect(lastRadicado).toBeNull();
    });

    it('debe retornar null si sequence es 0', async () => {
      mockRadicadoCounterModel.findOne.mockResolvedValue({
        year: 2025,
        sequence: 0,
      });

      const lastRadicado = await service.getLastRadicado();

      expect(lastRadicado).toBeNull();
    });

    it('debe obtener radicado de un año específico', async () => {
      mockRadicadoCounterModel.findOne.mockResolvedValue({
        year: 2023,
        sequence: 100,
      });

      const lastRadicado = await service.getLastRadicado(2023);

      expect(lastRadicado).toBe('2023-000100');
      expect(mockRadicadoCounterModel.findOne).toHaveBeenCalledWith({
        year: 2023,
      });
    });
  });

  describe('getRadicadoStats', () => {
    it('debe retornar estadísticas de radicados por año', async () => {
      const mockStats = [
        { year: 2025, sequence: 150 },
        { year: 2024, sequence: 1200 },
        { year: 2023, sequence: 980 },
      ];

      mockRadicadoCounterModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockStats),
        }),
      });

      const stats = await service.getRadicadoStats();

      expect(stats).toEqual([
        { year: 2025, count: 150 },
        { year: 2024, count: 1200 },
        { year: 2023, count: 980 },
      ]);
    });

    it('debe retornar array vacío si no hay estadísticas', async () => {
      mockRadicadoCounterModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const stats = await service.getRadicadoStats();

      expect(stats).toEqual([]);
    });
  });
});
