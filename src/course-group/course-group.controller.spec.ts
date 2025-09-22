import { Test, TestingModule } from '@nestjs/testing';
import { CourseGroupController } from './course-group.controller';
import { CourseGroupService } from './course-group.service';

describe('CourseGroupController', () => {
  let controller: CourseGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseGroupController],
      providers: [CourseGroupService],
    }).compile();

    controller = module.get<CourseGroupController>(CourseGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
