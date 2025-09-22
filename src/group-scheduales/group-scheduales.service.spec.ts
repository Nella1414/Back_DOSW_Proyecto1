import { Test, TestingModule } from '@nestjs/testing';
import { GroupSchedualesService } from './group-scheduales.service';

describe('GroupSchedualesService', () => {
  let service: GroupSchedualesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupSchedualesService],
    }).compile();

    service = module.get<GroupSchedualesService>(GroupSchedualesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
