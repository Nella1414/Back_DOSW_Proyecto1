import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from '../reports/reports.controller';
import { ReportsService } from '../reports/services/reports.service';
import { CreateReportDto } from '../reports/dto/create-report.dto';
import { UpdateReportDto } from '../reports/dto/update-report.dto';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockReportsService = {
    create: jest.fn().mockReturnValue('This action adds a new report'),
    findAll: jest.fn().mockReturnValue(['This action returns all reports']),
    findOne: jest.fn().mockReturnValue('This action returns a #1 report'),
    update: jest.fn().mockReturnValue('This action updates a #1 report'),
    remove: jest.fn().mockReturnValue('This action removes a #1 report'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new report', () => {
      const createDto: CreateReportDto = {} as any;
      const result = controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe('This action adds a new report');
    });
  });

  describe('findAll', () => {
    it('should return all reports', () => {
      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(['This action returns all reports']);
    });
  });

  describe('findOne', () => {
    it('should return a single report', () => {
      const id = '1';
      const result = controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(+id);
      expect(result).toBe('This action returns a #1 report');
    });
  });

  describe('update', () => {
    it('should update a report', () => {
      const id = '1';
      const updateDto: UpdateReportDto = {} as any;
      const result = controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(+id, updateDto);
      expect(result).toBe('This action updates a #1 report');
    });
  });

  describe('remove', () => {
    it('should remove a report', () => {
      const id = '1';
      const result = controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(+id);
      expect(result).toBe('This action removes a #1 report');
    });
  });
});
