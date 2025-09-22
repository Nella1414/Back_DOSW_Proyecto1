import { Test, TestingModule } from '@nestjs/testing';
import { RequestEventsController } from './request-events.controller';
import { RequestEventsService } from './request-events.service';

describe('RequestEventsController', () => {
  let controller: RequestEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestEventsController],
      providers: [RequestEventsService],
    }).compile();

    controller = module.get<RequestEventsController>(RequestEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
