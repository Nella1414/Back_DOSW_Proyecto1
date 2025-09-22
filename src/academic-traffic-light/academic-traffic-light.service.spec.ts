import { Test, TestingModule } from '@nestjs/testing';
import { AcademicTrafficLightService } from './academic-traffic-light.service';

describe('AcademicTrafficLightService', () => {
  let service: AcademicTrafficLightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicTrafficLightService],
    }).compile();

    service = module.get<AcademicTrafficLightService>(AcademicTrafficLightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
