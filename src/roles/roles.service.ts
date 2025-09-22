import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument, RoleName, Permission } from './entities/role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectModel(Role.name) 
    private readonly roleModel: Model<RoleDocument>
  ) {}

  async onModuleInit() {
    await this.initializeDefaultRoles();
  }

  private async initializeDefaultRoles() {
    const roles = [
      {
        name: RoleName.ADMIN,
        displayName: 'Administrator',
        description: 'Full access to all system features',
        permissions: Object.values(Permission), 
        priority: 4
      },
      {
        name: RoleName.DEAN,
        displayName: 'Dean',
        description: 'Academic and administrative management',
        permissions: [
          Permission.READ_USER,
          Permission.UPDATE_USER,
          Permission.CREATE_COURSE,
          Permission.READ_COURSE,
          Permission.UPDATE_COURSE,
          Permission.DELETE_COURSE,
          Permission.READ_ENROLLMENT,
          Permission.UPDATE_ENROLLMENT,
          Permission.CREATE_GRADE,
          Permission.READ_GRADE,
          Permission.UPDATE_GRADE,
          Permission.VIEW_REPORTS,
          Permission.EXPORT_DATA,
        ],
        priority: 3
      },
      {
        name: RoleName.STUDENT,
        displayName: 'Student',
        description: 'Basic access for students',
        permissions: [
          Permission.READ_COURSE,
          Permission.READ_ENROLLMENT,
          Permission.READ_GRADE,
        ],
        priority: 1
      }
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleModel.findOne({ name: roleData.name });
      if (!existingRole) {
        await this.roleModel.create(roleData);
      }
    }
  }

  //get all roles
  async findAll(): Promise<Role[]> {
    return this.roleModel.find({ isActive: true }).sort({ priority: -1 });
  }

  //get role by name
  async findByName(name: RoleName): Promise<Role | null> {
    return this.roleModel.findOne({ name, isActive: true });
  }

  //get roles by names
  async findByNames(names: RoleName[]): Promise<Role[]> {
    return this.roleModel.find({ 
      name: { $in: names }, 
      isActive: true 
    });
  }

  // Verify if a user has a specific permission
  async hasPermission(userRoles: string[], permission: Permission): Promise<boolean> {
    const roles = await this.roleModel.find({ 
      name: { $in: userRoles },
      isActive: true 
    });

    return roles.some(role => role.permissions.includes(permission));
  }

  // get all permissions for a user based on their roles
  async getUserPermissions(userRoles: string[]): Promise<Permission[]> {
    const roles = await this.roleModel.find({ 
      name: { $in: userRoles },
      isActive: true 
    });

    const permissions = new Set<Permission>();
    roles.forEach(role => {
      role.permissions.forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
  }

  // Verify if user has higher priority role than the target role
  async hasHigherPriority(userRoles: string[], targetRole: string): Promise<boolean> {
    const userRoleObjects = await this.findByNames(userRoles as RoleName[]);
    const targetRoleObject = await this.findByName(targetRole as RoleName);

    if (!targetRoleObject || userRoleObjects.length === 0) {
      return false;
    }

    const maxUserPriority = Math.max(...userRoleObjects.map(role => role.priority));
    return maxUserPriority > targetRoleObject.priority;
  }

  // Verify if is admin
  isAdmin(userRoles: string[]): boolean {
    return userRoles.includes(RoleName.ADMIN);
  }

  // Verify if is dean
  isDean(userRoles: string[]): boolean {
    return userRoles.includes(RoleName.DEAN);
  }


  // Verify if is student
  isStudent(userRoles: string[]): boolean {
    return userRoles.includes(RoleName.STUDENT);
  }

  // Verify if user has any administrative role (admin or dean)
  hasAdministrativeRole(userRoles: string[]): boolean {
    return this.isAdmin(userRoles) || this.isDean(userRoles);
  }
}