import { Test, TestingModule } from '@nestjs/testing';
import { AcademicTrafficLightController } from './academic-traffic-light.controller';
import { AcademicTrafficLightService } from './academic-traffic-light.service';

describe('AcademicTrafficLightController', () => {
  let controller: AcademicTrafficLightController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicTrafficLightController],
      providers: [AcademicTrafficLightService],
    }).compile();

    controller = module.get<AcademicTrafficLightController>(AcademicTrafficLightController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
