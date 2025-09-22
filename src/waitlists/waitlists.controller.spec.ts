import { Test, TestingModule } from '@nestjs/testing';
import { WaitlistsController } from './waitlists.controller';
import { WaitlistsService } from './waitlists.service';

describe('WaitlistsController', () => {
  let controller: WaitlistsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WaitlistsController],
      providers: [WaitlistsService],
    }).compile();

    controller = module.get<WaitlistsController>(WaitlistsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
