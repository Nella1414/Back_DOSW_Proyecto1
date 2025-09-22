import { Test, TestingModule } from '@nestjs/testing';
import { ProgramAccesController } from './program-acces.controller';
import { ProgramAccesService } from './program-acces.service';

describe('ProgramAccesController', () => {
  let controller: ProgramAccesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramAccesController],
      providers: [ProgramAccesService],
    }).compile();

    controller = module.get<ProgramAccesController>(ProgramAccesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
