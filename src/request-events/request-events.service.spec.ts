import { Test, TestingModule } from '@nestjs/testing';
import { RequestEventsService } from './request-events.service';

describe('RequestEventsService', () => {
  let service: RequestEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestEventsService],
    }).compile();

    service = module.get<RequestEventsService>(RequestEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
