import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsController } from '../programs/programs.controller';
import { ProgramsService } from '../programs/services/programs.service';
import { CreateProgramDto } from '../programs/dto/create-program.dto';
import { UpdateProgramDto } from '../programs/dto/update-program.dto';

describe('ProgramsController', () => {
  let controller: ProgramsController;
  let service: ProgramsService;

  const mockProgramsService = {
    create: jest.fn().mockReturnValue('This action adds a new program'),
    findAll: jest.fn().mockReturnValue(['This action returns all programs']),
    findOne: jest.fn().mockReturnValue('This action returns a #1 program'),
    update: jest.fn().mockReturnValue('This action updates a #1 program'),
    remove: jest.fn().mockReturnValue('This action removes a #1 program'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramsController],
      providers: [
        {
          provide: ProgramsService,
          useValue: mockProgramsService,
        },
      ],
    }).compile();

    controller = module.get<ProgramsController>(ProgramsController);
    service = module.get<ProgramsService>(ProgramsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new program', () => {
      const createDto: CreateProgramDto = {} as any;
      const result = controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe('This action adds a new program');
    });

    it('should call service create method once', () => {
      const createDto: CreateProgramDto = {} as any;
      controller.create(createDto);

      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all programs', () => {
      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(['This action returns all programs']);
    });

    it('should call service findAll method once', () => {
      controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single program', () => {
      const id = '1';
      const result = controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe('This action returns a #1 program');
    });

    it('should convert string id to number', () => {
      const id = '42';
      controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(42);
    });

    it('should call service findOne method once', () => {
      controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a program', () => {
      const id = '1';
      const updateDto: UpdateProgramDto = {} as any;
      const result = controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBe('This action updates a #1 program');
    });

    it('should convert string id to number', () => {
      const id = '99';
      const updateDto: UpdateProgramDto = {} as any;
      controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(99, updateDto);
    });

    it('should call service update method once', () => {
      controller.update('1', {} as any);

      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a program', () => {
      const id = '1';
      const result = controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBe('This action removes a #1 program');
    });

    it('should convert string id to number', () => {
      const id = '123';
      controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(123);
    });

    it('should call service remove method once', () => {
      controller.remove('1');

      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration: Complete program lifecycle', () => {
    it('should create, retrieve, update and delete programs', () => {
      const createDto: CreateProgramDto = {} as any;
      
      // Create
      const created = controller.create(createDto);
      expect(created).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);

      // Find all
      const all = controller.findAll();
      expect(all).toBeDefined();
      expect(service.findAll).toHaveBeenCalled();

      // Find one
      const one = controller.findOne('1');
      expect(one).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith(1);

      // Update
      const updateDto: UpdateProgramDto = {} as any;
      const updated = controller.update('1', updateDto);
      expect(updated).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(1, updateDto);

      // Remove
      const removed = controller.remove('1');
      expect(removed).toBeDefined();
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
