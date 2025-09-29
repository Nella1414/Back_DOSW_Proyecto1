import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RolesService } from './services/roles.service';

/**
 * * Roles and Permissions Controller
 *
 * ! Controller completamente vacio - No tiene endpoints implementados
 * ? Este controlador deberia manejar roles y permisos del sistema
 * TODO: Implementar CRUD completo para roles
 * TODO: Agregar endpoints para gestion de permisos
 * TODO: Implementar validacion de ADMIN-only para estas operaciones
 * TODO: Agregar Swagger documentation
 */
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ! Todas las funciones basicas faltantes:
  // TODO: @Get() findAll() - Listar todos los roles
  // TODO: @Get(':id') findOne() - Obtener rol por ID
  // TODO: @Post() create() - Crear nuevo rol
  // TODO: @Patch(':id') update() - Actualizar rol
  // TODO: @Delete(':id') remove() - Eliminar rol
  // TODO: @Get(':id/permissions') getRolePermissions() - Obtener permisos de rol
  // TODO: @Post(':id/permissions') addPermissions() - Agregar permisos a rol
  // TODO: @Delete(':id/permissions/:permission') removePermission() - Quitar permiso
}
