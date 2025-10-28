import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from '../roles/roles.controller';
import { RolesService } from '../roles/services/roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockRolesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have RolesService injected', () => {
    expect(service).toBeDefined();
  });
});
