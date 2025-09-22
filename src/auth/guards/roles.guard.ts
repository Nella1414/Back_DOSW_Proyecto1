import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../../roles/roles.service';
import { ROLES_KEY, PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators/auth.decorator';
import { RoleName, Permission } from '../../roles/entities/role.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verify if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If there's no user in the request, deny access
    if (!user) {
      throw new ForbiddenException('Unauthenticated user');
    }

    // Get required roles from the decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get required permissions from the decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions are required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const userRoles = user.roles || [];

    // Verify if the user has the required roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. One of the following roles is required: ${requiredRoles.join(', ')}`
        );
      }
    }

    // Verify if the user has the required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      for (const permission of requiredPermissions) {
        const hasPermission = await this.rolesService.hasPermission(userRoles, permission);
        if (!hasPermission) {
          throw new ForbiddenException(
            `Access denied. Permission required: ${permission}`
          );
        }
      }
    }

    return true;
  }
}