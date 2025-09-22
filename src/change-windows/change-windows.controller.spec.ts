import { Test, TestingModule } from '@nestjs/testing';
import { ChangeWindowsController } from './change-windows.controller';
import { ChangeWindowsService } from './change-windows.service';

describe('ChangeWindowsController', () => {
  let controller: ChangeWindowsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChangeWindowsController],
      providers: [ChangeWindowsService],
    }).compile();

    controller = module.get<ChangeWindowsController>(ChangeWindowsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
