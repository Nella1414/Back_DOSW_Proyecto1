import { Test, TestingModule } from '@nestjs/testing';
import { GroupSchedualesController } from './group-scheduales.controller';
import { GroupSchedualesService } from './group-scheduales.service';

describe('GroupSchedualesController', () => {
  let controller: GroupSchedualesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupSchedualesController],
      providers: [GroupSchedualesService],
    }).compile();

    controller = module.get<GroupSchedualesController>(GroupSchedualesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
