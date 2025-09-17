import { Body, Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Roles } from '../common/roles/roles.decorator';
import { RolesGuard } from '../common/roles/roles.guard';
import { UserRole } from '../users/schema/user.schema';
import { SubjectsService } from './subjects.service';

@ApiTags('Materias')
@UseGuards(RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly s: SubjectsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear materia' })
  @ApiBody({ schema: { properties: { code: { type: 'string' }, name: { type: 'string' } } } })
  async create(@Body() body: { code: string; name: string }) {
    return this.s.create(body.code, body.name);
  }

  @Get()
  @ApiOperation({ summary: 'Listar materias' })
  async list() {
    return this.s.findAll();
  }
}
