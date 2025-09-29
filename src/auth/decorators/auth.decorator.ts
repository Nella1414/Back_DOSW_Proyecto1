// Import NestJS metadata utilities for creating custom decorators
import { SetMetadata } from '@nestjs/common';
import { RoleName, Permission } from '../../roles/entities/role.entity';

// ===== METADATA KEYS =====
// These constants define the keys used to store metadata on route handlers

/** Key for storing required roles metadata */
export const ROLES_KEY = 'roles';

/** Key for storing required permissions metadata */
export const PERMISSIONS_KEY = 'permissions';

/** Key for marking routes as public (no authentication required) */
export const IS_PUBLIC_KEY = 'isPublic';

// ===== AUTHORIZATION DECORATORS =====
// These decorators control access to routes based on user roles and permissions

/**
 * @Roles - Requires user to have specific roles
 *
 * Usage: @Roles(RoleName.ADMIN, RoleName.DEAN)
 * Effect: Only users with ADMIN OR DEAN roles can access the route
 *
 * @param roles - One or more roles that grant access
 * @returns Decorator function that sets role metadata
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);

/**
 * @RequirePermissions - Requires user to have specific permissions
 *
 * Usage: @RequirePermissions(Permission.CREATE_USER, Permission.DELETE_USER)
 * Effect: User must have ALL specified permissions to access the route
 *
 * This is more granular than roles - checks actual permissions
 * assigned to the user's roles in the database.
 *
 * @param permissions - One or more permissions that grant access
 * @returns Decorator function that sets permission metadata
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * @Public - Marks route as publicly accessible
 *
 * Usage: @Public()
 * Effect: Route bypasses all authentication and authorization
 *
 * Use for:
 * - Login/register endpoints
 * - Public content endpoints
 * - Health checks
 * - Documentation endpoints
 *
 * @returns Decorator function that marks route as public
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ===== CONVENIENCE DECORATORS =====
// Pre-configured decorators for common access patterns

/**
 * @AdminOnly - Shorthand for admin-only access
 *
 * Usage: @AdminOnly()
 * Effect: Same as @Roles(RoleName.ADMIN)
 * Only administrators can access the route
 */
export const AdminOnly = () => Roles(RoleName.ADMIN);

/**
 * @AdminOrDean - Shorthand for administrative access
 *
 * Usage: @AdminOrDean()
 * Effect: Same as @Roles(RoleName.ADMIN, RoleName.DEAN)
 * Administrators or deans can access the route
 */
export const AdminOrDean = () => Roles(RoleName.ADMIN, RoleName.DEAN);

/**
 * @AuthenticatedOnly - Requires valid authentication (any role)
 *
 * Usage: @AuthenticatedOnly()
 * Effect: User must be logged in but no specific role required
 *
 * Note: This is the default behavior when no decorators are used,
 * so this decorator is mainly for explicit documentation.
 */
export const AuthenticatedOnly = () => SetMetadata('authenticated', true);

/**
 * @Auth - Requires user to have specific roles (simplified version)
 *
 * Usage: @Auth('ADMIN', 'FACULTY')
 * Effect: Only users with ADMIN OR FACULTY roles can access the route
 *
 * @param roles - One or more role names as strings
 * @returns Decorator function that sets role metadata
 */
export const Auth = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
