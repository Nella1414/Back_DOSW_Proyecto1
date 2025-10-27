import { Test, TestingModule } from '@nestjs/testing';
import { GroupSchedulesController } from '../group-schedules/group-schedules.controller';
import { GroupSchedulesService } from '../group-schedules/services/group-schedules.service';
import { CreateGroupScheduleDto } from '../group-schedules/dto/create-group-schedule.dto';
import { UpdateGroupScheduleDto } from '../group-schedules/dto/update-group-schedule.dto';

describe('GroupSchedulesController', () => {
  let controller: GroupSchedulesController;
  let service: GroupSchedulesService;

  const mockGroupSchedulesService = {
    create: jest.fn().mockReturnValue('This action adds a new groupSchedule'),
    findAll: jest.fn().mockReturnValue(['This action returns all groupSchedules']),
    findOne: jest.fn().mockReturnValue('This action returns a #1 groupSchedule'),
    update: jest.fn().mockReturnValue('This action updates a #1 groupSchedule'),
    remove: jest.fn().mockReturnValue('This action removes a #1 groupSchedule'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupSchedulesController],
      providers: [
        {
          provide: GroupSchedulesService,
          useValue: mockGroupSchedulesService,
        },
      ],
    }).compile();

    controller = module.get<GroupSchedulesController>(GroupSchedulesController);
    service = module.get<GroupSchedulesService>(GroupSchedulesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new groupSchedule', () => {
      const createDto: CreateGroupScheduleDto = {} as any;
      const result = controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe('This action adds a new groupSchedule');
    });
  });

  describe('findAll', () => {
    it('should return all groupSchedules', () => {
      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(['This action returns all groupSchedules']);
    });
  });

  describe('findOne', () => {
    it('should return a single groupSchedule', () => {
      const id = '1';
      const result = controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe('This action returns a #1 groupSchedule');
    });
  });

  describe('update', () => {
    it('should update a groupSchedule', () => {
      const id = '1';
      const updateDto: UpdateGroupScheduleDto = {} as any;
      const result = controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBe('This action updates a #1 groupSchedule');
    });
  });

  describe('remove', () => {
    it('should remove a groupSchedule', () => {
      const id = '1';
      const result = controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBe('This action removes a #1 groupSchedule');
    });
  });
});
