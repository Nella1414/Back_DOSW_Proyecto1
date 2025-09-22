import { Test, TestingModule } from '@nestjs/testing';
import { CourseGroupService } from './course-group.service';

describe('CourseGroupService', () => {
  let service: CourseGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CourseGroupService],
    }).compile();

    service = module.get<CourseGroupService>(CourseGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
