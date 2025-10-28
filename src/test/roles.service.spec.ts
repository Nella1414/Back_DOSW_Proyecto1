import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RolesService } from '../roles/services/roles.service';
import {
  Role,
  RoleDocument,
  RoleName,
  Permission,
} from '../roles/entities/role.entity';

describe('RolesService', () => {
  let service: RolesService;
  let roleModel: Model<RoleDocument>;

  const mockRoles = [
    {
      _id: 'role1',
      name: RoleName.ADMIN,
      displayName: 'Administrator',
      description: 'Full access',
      permissions: Object.values(Permission),
      isActive: true,
      priority: 4,
    },
    {
      _id: 'role2',
      name: RoleName.DEAN,
      displayName: 'Dean',
      description: 'Academic management',
      permissions: [Permission.READ_USER, Permission.READ_COURSE],
      isActive: true,
      priority: 3,
    },
    {
      _id: 'role3',
      name: RoleName.STUDENT,
      displayName: 'Student',
      description: 'Basic access',
      permissions: [Permission.READ_COURSE, Permission.READ_ENROLLMENT],
      isActive: true,
      priority: 1,
    },
  ];

  beforeEach(async () => {
    const mockRoleModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getModelToken(Role.name),
          useValue: mockRoleModel,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleModel = module.get<Model<RoleDocument>>(getModelToken(Role.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize default roles when none exist', async () => {
      (roleModel.findOne as jest.Mock).mockResolvedValue(null);

      const createdRoles: any[] = [];
      (roleModel.create as jest.Mock).mockImplementation((role) => {
        createdRoles.push(role);
        return Promise.resolve(role);
      });

      await service.onModuleInit();

      expect(roleModel.create).toHaveBeenCalledTimes(3);
      expect(createdRoles.find((r) => r.name === RoleName.ADMIN)).toBeDefined();
      expect(createdRoles.find((r) => r.name === RoleName.DEAN)).toBeDefined();
      expect(createdRoles.find((r) => r.name === RoleName.STUDENT)).toBeDefined();
    });

    it('should not initialize roles when they already exist', async () => {
      (roleModel.findOne as jest.Mock).mockResolvedValue(mockRoles[0]);

      await service.onModuleInit();

      expect(roleModel.create).not.toHaveBeenCalled();
    });

    it('should create ADMIN role with all permissions', async () => {
      (roleModel.findOne as jest.Mock).mockResolvedValue(null);

      let adminRole: any;
      (roleModel.create as jest.Mock).mockImplementation((role) => {
        if (role.name === RoleName.ADMIN) {
          adminRole = role;
        }
        return Promise.resolve(role);
      });

      await service.onModuleInit();

      expect(adminRole).toBeDefined();
      expect(adminRole.priority).toBe(4);
      expect(adminRole.permissions).toContain(Permission.CREATE_USER);
      expect(adminRole.permissions).toContain(Permission.DELETE_USER);
    });

    it('should create DEAN role with limited permissions', async () => {
      (roleModel.findOne as jest.Mock).mockResolvedValue(null);

      let deanRole: any;
      (roleModel.create as jest.Mock).mockImplementation((role) => {
        if (role.name === RoleName.DEAN) {
          deanRole = role;
        }
        return Promise.resolve(role);
      });

      await service.onModuleInit();

      expect(deanRole).toBeDefined();
      expect(deanRole.priority).toBe(3);
      expect(deanRole.permissions.length).toBeGreaterThan(0);
    });

    it('should create STUDENT role with minimal permissions', async () => {
      (roleModel.findOne as jest.Mock).mockResolvedValue(null);

      let studentRole: any;
      (roleModel.create as jest.Mock).mockImplementation((role) => {
        if (role.name === RoleName.STUDENT) {
          studentRole = role;
        }
        return Promise.resolve(role);
      });

      await service.onModuleInit();

      expect(studentRole).toBeDefined();
      expect(studentRole.priority).toBe(1);
      expect(studentRole.permissions).toContain(Permission.READ_COURSE);
    });
  });

  describe('findAll', () => {
    it('should return all active roles sorted by priority', async () => {
      const mockChain = {
        sort: jest.fn().mockResolvedValue(mockRoles),
      };
      (roleModel.find as jest.Mock).mockReturnValue(mockChain);

      const result = await service.findAll();

      expect(roleModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockChain.sort).toHaveBeenCalledWith({ priority: -1 });
      expect(result).toEqual(mockRoles);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no roles exist', async () => {
      const mockChain = {
        sort: jest.fn().mockResolvedValue([]),
      };
      (roleModel.find as jest.Mock).mockReturnValue(mockChain);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('should return a role by name', async () => {
      (roleModel.findOne as jest.Mock).mockResolvedValue(mockRoles[0]);

      const result = await service.findByName(RoleName.ADMIN);

      expect(roleModel.findOne).toHaveBeenCalledWith({
        name: RoleName.ADMIN,
        isActive: true,
      });
      expect(result).toEqual(mockRoles[0]);
    });

    it('should return null when role not found', async () => {
      (roleModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findByName(RoleName.ADMIN);

      expect(result).toBeNull();
    });
  });

  describe('findByNames', () => {
    it('should return multiple roles by names', async () => {
      const selectedRoles = [mockRoles[0], mockRoles[2]];
      (roleModel.find as jest.Mock).mockResolvedValue(selectedRoles);

      const result = await service.findByNames([RoleName.ADMIN, RoleName.STUDENT]);

      expect(roleModel.find).toHaveBeenCalledWith({
        name: { $in: [RoleName.ADMIN, RoleName.STUDENT] },
        isActive: true,
      });
      expect(result).toEqual(selectedRoles);
    });

    it('should return empty array when no matching roles', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findByNames([RoleName.ADMIN]);

      expect(result).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([mockRoles[0]]);

      const result = await service.hasPermission(
        [RoleName.ADMIN],
        Permission.CREATE_USER,
      );

      expect(result).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([mockRoles[2]]);

      const result = await service.hasPermission(
        [RoleName.STUDENT],
        Permission.DELETE_USER,
      );

      expect(result).toBe(false);
    });

    it('should return false when no roles found', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([]);

      const result = await service.hasPermission(
        [RoleName.ADMIN],
        Permission.CREATE_USER,
      );

      expect(result).toBe(false);
    });

    it('should check permission across multiple roles', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([mockRoles[1], mockRoles[2]]);

      const result = await service.hasPermission(
        [RoleName.DEAN, RoleName.STUDENT],
        Permission.READ_USER,
      );

      expect(result).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for a user', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([mockRoles[1], mockRoles[2]]);

      const result = await service.getUserPermissions([
        RoleName.DEAN,
        RoleName.STUDENT,
      ]);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(Permission.READ_USER);
      expect(result).toContain(Permission.READ_COURSE);
    });

    it('should return unique permissions', async () => {
      const rolesWithDuplicate = [
        {
          ...mockRoles[1],
          permissions: [Permission.READ_COURSE, Permission.READ_USER],
        },
        {
          ...mockRoles[2],
          permissions: [Permission.READ_COURSE, Permission.READ_ENROLLMENT],
        },
      ];

      (roleModel.find as jest.Mock).mockResolvedValue(rolesWithDuplicate);

      const result = await service.getUserPermissions([
        RoleName.DEAN,
        RoleName.STUDENT,
      ]);

      const uniquePerms = [...new Set(result)];
      expect(result.length).toBe(uniquePerms.length);
    });

    it('should return empty array when no roles found', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserPermissions([RoleName.ADMIN]);

      expect(result).toEqual([]);
    });
  });

  describe('hasHigherPriority', () => {
    it('should return true when user has higher priority role', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([mockRoles[0]]);
      (roleModel.findOne as jest.Mock).mockResolvedValue(mockRoles[2]);

      const result = await service.hasHigherPriority(
        [RoleName.ADMIN],
        RoleName.STUDENT,
      );

      expect(result).toBe(true);
    });

    it('should return false when user has lower priority', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([mockRoles[2]]);
      (roleModel.findOne as jest.Mock).mockResolvedValue(mockRoles[0]);

      const result = await service.hasHigherPriority(
        [RoleName.STUDENT],
        RoleName.ADMIN,
      );

      expect(result).toBe(false);
    });

    it('should return false when target role not found', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([mockRoles[0]]);
      (roleModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hasHigherPriority(
        [RoleName.ADMIN],
        RoleName.STUDENT,
      );

      expect(result).toBe(false);
    });

    it('should handle user with multiple roles', async () => {
      (roleModel.find as jest.Mock).mockResolvedValue([mockRoles[0], mockRoles[2]]);
      (roleModel.findOne as jest.Mock).mockResolvedValue(mockRoles[1]);

      const result = await service.hasHigherPriority(
        [RoleName.ADMIN, RoleName.STUDENT],
        RoleName.DEAN,
      );

      expect(result).toBe(true); // MAX priority is ADMIN (4) > DEAN (3)
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      const result = service.isAdmin([RoleName.ADMIN]);

      expect(result).toBe(true);
    });

    it('should return false for non-admin users', async () => {
      const result = service.isAdmin([RoleName.STUDENT]);

      expect(result).toBe(false);
    });

    it('should return true if admin is in multiple roles', async () => {
      const result = service.isAdmin([RoleName.STUDENT, RoleName.ADMIN]);

      expect(result).toBe(true);
    });
  });

  describe('isDean', () => {
    it('should return true for dean users', async () => {
      const result = service.isDean([RoleName.DEAN]);

      expect(result).toBe(true);
    });

    it('should return false for non-dean users', async () => {
      const result = service.isDean([RoleName.STUDENT]);

      expect(result).toBe(false);
    });
  });

  describe('isStudent', () => {
    it('should return true for student users', async () => {
      const result = service.isStudent([RoleName.STUDENT]);

      expect(result).toBe(true);
    });

    it('should return false for non-student users', async () => {
      const result = service.isStudent([RoleName.ADMIN]);

      expect(result).toBe(false);
    });
  });

  describe('hasAdministrativeRole', () => {
    it('should return true for admins', async () => {
      const result = service.hasAdministrativeRole([RoleName.ADMIN]);

      expect(result).toBe(true);
    });

    it('should return true for deans', async () => {
      const result = service.hasAdministrativeRole([RoleName.DEAN]);

      expect(result).toBe(true);
    });

    it('should return false for students', async () => {
      const result = service.hasAdministrativeRole([RoleName.STUDENT]);

      expect(result).toBe(false);
    });

    it('should return true if user has any administrative role', async () => {
      const result = service.hasAdministrativeRole([
        RoleName.STUDENT,
        RoleName.DEAN,
      ]);

      expect(result).toBe(true);
    });
  });
});
