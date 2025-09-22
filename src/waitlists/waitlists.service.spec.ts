import { Test, TestingModule } from '@nestjs/testing';
import { WaitlistsService } from './waitlists.service';

describe('WaitlistsService', () => {
  let service: WaitlistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaitlistsService],
    }).compile();

    service = module.get<WaitlistsService>(WaitlistsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
