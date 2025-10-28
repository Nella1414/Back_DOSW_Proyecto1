import { Test, TestingModule } from '@nestjs/testing';
import { ChangeWindowsController } from '../change-windows/change-windows.controller';
import { ChangeWindowsService } from '../change-windows/services/change-windows.service';
import { CreateChangeWindowDto } from '../change-windows/dto/create-change-window.dto';
import { UpdateChangeWindowDto } from '../change-windows/dto/update-change-window.dto';

describe('ChangeWindowsController', () => {
  let controller: ChangeWindowsController;
  let service: ChangeWindowsService;

  const mockChangeWindowsService = {
    create: jest.fn().mockReturnValue('This action adds a new changeWindow'),
    findAll: jest.fn().mockReturnValue(['This action returns all changeWindows']),
    findOne: jest.fn().mockReturnValue('This action returns a #1 changeWindow'),
    update: jest.fn().mockReturnValue('This action updates a #1 changeWindow'),
    remove: jest.fn().mockReturnValue('This action removes a #1 changeWindow'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChangeWindowsController],
      providers: [
        {
          provide: ChangeWindowsService,
          useValue: mockChangeWindowsService,
        },
      ],
    }).compile();

    controller = module.get<ChangeWindowsController>(ChangeWindowsController);
    service = module.get<ChangeWindowsService>(ChangeWindowsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new changeWindow', () => {
      const createDto: CreateChangeWindowDto = {} as any;
      const result = controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe('This action adds a new changeWindow');
    });
  });

  describe('findAll', () => {
    it('should return all changeWindows', () => {
      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(['This action returns all changeWindows']);
    });
  });

  describe('findOne', () => {
    it('should return a single changeWindow', () => {
      const id = '1';
      const result = controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe('This action returns a #1 changeWindow');
    });
  });

  describe('update', () => {
    it('should update a changeWindow', () => {
      const id = '1';
      const updateDto: UpdateChangeWindowDto = {} as any;
      const result = controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBe('This action updates a #1 changeWindow');
    });
  });

  describe('remove', () => {
    it('should remove a changeWindow', () => {
      const id = '1';
      const result = controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBe('This action removes a #1 changeWindow');
    });
  });
});
