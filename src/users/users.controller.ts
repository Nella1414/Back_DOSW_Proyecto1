import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { GroupsService } from '../groups/groups.service';
import { UserRole } from './schema/user.schema';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ schema: { properties: { username: { type: 'string' }, password: { type: 'string' }, role: { type: 'string', enum: ['student', 'deanery', 'admin'] } } } })
  async register(
    @Body() body: { username: string; password: string; role?: UserRole },
  ) {
    return this.usersService.create(body.username, body.password, body.role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  async list() {
    return this.usersService.findAll();
  }

  @Post(':id/join/:groupId')
  @ApiOperation({ summary: 'Unir usuario a grupo' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiParam({ name: 'groupId', description: 'ID del grupo' })
  async joinGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ) {
    return this.usersService.addGroup(id, groupId);
  }
// el id que usamos aqui literalmente lo borré entonces... o agregar uno autogenerado o, ver que otras opciones hay
  @Get(':id/schedule')
  @ApiOperation({ summary: 'Obtener horario del usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async getSchedule(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) return { error: 'Usuario no encontrado' };

    const groups = await this.groupsService.findMany(user.groupIds);

    return { user: user.username, schedule: groups };
  }
}
