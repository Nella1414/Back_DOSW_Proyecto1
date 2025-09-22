import { SetMetadata } from '@nestjs/common';
import { RoleName, Permission } from '../../roles/entities/role.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const AdminOnly = () => Roles(RoleName.ADMIN);
export const AdminOrDean = () => Roles(RoleName.ADMIN, RoleName.DEAN);
export const AuthenticatedOnly = () => SetMetadata('authenticated', true);