// Import necessary NestJS decorators and types for guard implementation
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Import services and types for role/permission management
import { RolesService } from '../../roles/services/roles.service';
import {
  ROLES_KEY,
  PERMISSIONS_KEY,
  IS_PUBLIC_KEY,
} from '../decorators/auth.decorator';
import { RoleName, Permission } from '../../roles/entities/role.entity';

/**
 * RolesGuard enforces role-based and permission-based access control
 *
 * This guard runs after JWT authentication and checks if the authenticated user
 * has the required roles or permissions to access specific endpoints.
 *
 * Authorization Flow:
 * 1. Check if route is public (bypass authorization)
 * 2. Verify user is authenticated
 * 3. Extract required roles/permissions from decorators
 * 4. Validate user has required roles
 * 5. Validate user has required permissions (if specified)
 *
 * Usage:
 * - Applied globally to all routes by default
 * - Routes can be marked as @Public() to bypass
 * - Routes can require specific @Roles() or @RequirePermissions()
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Constructor injects dependencies for role validation
   * @param reflector - NestJS service to read metadata from decorators
   * @param rolesService - Service to validate user permissions against roles
   */
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
  ) {}

  /**
   * Main guard method that determines if user can access the route
   *
   * This method implements the complete authorization logic:
   * - Public routes bypass all checks
   * - Authenticated routes require valid user
   * - Protected routes require specific roles/permissions
   *
   * @param context - Execution context containing request data and metadata
   * @returns Promise<boolean> - true if access granted, throws exception if denied
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Step 1: Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Method level decorator
      context.getClass(), // Class level decorator
    ]);

    // Allow access to public routes without any checks
    if (isPublic) {
      return true;
    }

    // Step 2: Extract user from request (added by JWT Guard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Deny access if user is not authenticated
    if (!user) {
      throw new ForbiddenException('Unauthenticated user');
    }

    // Step 3: Extract required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Step 4: Extract required permissions from @RequirePermissions() decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Step 5: If no specific roles or permissions required, allow authenticated users
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    // Get user's roles from JWT payload
    const userRoles = user.roles || [];

    // Step 6: Validate user has required roles (if specified)
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. One of the following roles is required: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Step 7: Validate user has required permissions (if specified)
    if (requiredPermissions && requiredPermissions.length > 0) {
      for (const permission of requiredPermissions) {
        // Check each permission against user's roles
        const hasPermission = await this.rolesService.hasPermission(
          userRoles,
          permission,
        );
        if (!hasPermission) {
          throw new ForbiddenException(
            `Access denied. Permission required: ${permission}`,
          );
        }
      }
    }

    // If all checks pass, grant access
    return true;
  }
}
