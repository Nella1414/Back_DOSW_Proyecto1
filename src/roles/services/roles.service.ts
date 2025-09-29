import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument, RoleName, Permission } from '../entities/role.entity';

/**
 * * RolesService handles role and permission management
 *
 * ? Este servicio esta bien implementado con todas las funciones basicas
 * ? Maneja roles del sistema, permisos y validaciones de autoridad
 * TODO: Agregar audit logging para cambios de permisos
 * TODO: Implementar cache para consultas frecuentes de permisos
 * TODO: Agregar funciones CRUD para roles dinamicos
 */
@Injectable()
export class RolesService implements OnModuleInit {
  /**
   * * Constructor injects Role MongoDB model
   * @param roleModel - Mongoose model for Role collection operations
   */
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>
  ) {}

  /**
   * * Module initialization - creates default roles if not exist
   * ? Ejecuta automaticamente al iniciar el modulo
   * TODO: Agregar logging de inicializacion
   */
  async onModuleInit() {
    await this.initializeDefaultRoles();
  }

  /**
   * * Creates default system roles (ADMIN, DEAN, STUDENT)
   * ? Roles se crean solo si no existen previamente
   * ? ADMIN tiene todos los permisos, DEAN tiene permisos administrativos limitados
   * TODO: Hacer roles configurables desde archivo de configuracion
   */
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
          Permission.READ_USER,
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

  /**
   * * Get all active roles sorted by priority
   * ? Retorna roles ordenados por prioridad (mayor a menor)
   * TODO: Agregar paginacion para sistemas con muchos roles
   */
  async findAll(): Promise<Role[]> {
    return this.roleModel.find({ isActive: true }).sort({ priority: -1 });
  }

  /**
   * * Get role by name
   * ? Busca rol activo por nombre exacto
   * TODO: Agregar cache para roles frecuentemente consultados
   */
  async findByName(name: RoleName): Promise<Role | null> {
    return this.roleModel.findOne({ name, isActive: true });
  }

  /**
   * * Get multiple roles by names array
   * ? Busca multiples roles activos en una sola consulta
   * TODO: Validar que todos los nombres solicitados sean validos
   */
  async findByNames(names: RoleName[]): Promise<Role[]> {
    return this.roleModel.find({
      name: { $in: names },
      isActive: true
    });
  }

  /**
   * * Verify if user has specific permission
   * ? Verifica permisos basado en todos los roles del usuario
   * ? Retorna true si al menos un rol tiene el permiso
   * TODO: Agregar cache de permisos para mejorar performance
   */
  async hasPermission(userRoles: string[], permission: Permission): Promise<boolean> {
    const roles = await this.roleModel.find({
      name: { $in: userRoles },
      isActive: true
    });

    return roles.some(role => role.permissions.includes(permission));
  }

  /**
   * * Get all permissions for user based on their roles
   * ? Combina permisos de todos los roles del usuario
   * ? Usa Set para evitar duplicados
   * TODO: Implementar cache con TTL para permisos de usuario
   */
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

  /**
   * * Verify if user has higher priority than target role
   * ? Compara la prioridad maxima del usuario con el rol objetivo
   * ? ADMIN (4) > DEAN (3) > STUDENT (1)
   * TODO: Agregar logging de validaciones de prioridad
   */
  async hasHigherPriority(userRoles: string[], targetRole: string): Promise<boolean> {
    const userRoleObjects = await this.findByNames(userRoles as RoleName[]);
    const targetRoleObject = await this.findByName(targetRole as RoleName);

    if (!targetRoleObject || userRoleObjects.length === 0) {
      return false;
    }

    const maxUserPriority = Math.max(...userRoleObjects.map(role => role.priority));
    return maxUserPriority > targetRoleObject.priority;
  }

  /**
   * * Check if user is admin
   * ? Verificacion directa de rol ADMIN
   */
  isAdmin(userRoles: string[]): boolean {
    return userRoles.includes(RoleName.ADMIN);
  }

  /**
   * * Check if user is dean
   * ? Verificacion directa de rol DEAN
   */
  isDean(userRoles: string[]): boolean {
    return userRoles.includes(RoleName.DEAN);
  }

  /**
   * * Check if user is student
   * ? Verificacion directa de rol STUDENT
   */
  isStudent(userRoles: string[]): boolean {
    return userRoles.includes(RoleName.STUDENT);
  }

  /**
   * * Check if user has administrative role
   * ? Verifica si el usuario es ADMIN o DEAN
   * ? Util para endpoints que requieren permisos administrativos
   * TODO: Agregar mas roles administrativos si es necesario
   */
  hasAdministrativeRole(userRoles: string[]): boolean {
    return this.isAdmin(userRoles) || this.isDean(userRoles);
  }
}