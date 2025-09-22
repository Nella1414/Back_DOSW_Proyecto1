import { Test, TestingModule } from '@nestjs/testing';
import { ChangeWindowsService } from './change-windows.service';

describe('ChangeWindowsService', () => {
  let service: ChangeWindowsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChangeWindowsService],
    }).compile();

    service = module.get<ChangeWindowsService>(ChangeWindowsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
