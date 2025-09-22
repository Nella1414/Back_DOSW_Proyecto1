import { Test, TestingModule } from '@nestjs/testing';
import { ProgramAccesService } from './program-acces.service';

describe('ProgramAccesService', () => {
  let service: ProgramAccesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgramAccesService],
    }).compile();

    service = module.get<ProgramAccesService>(ProgramAccesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
