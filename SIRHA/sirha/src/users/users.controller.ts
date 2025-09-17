import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { GroupsService } from '../groups/groups.service';
import { UserRole } from './schema/user.schema';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Post('register')
  async register(
    @Body() body: { username: string; password: string; role?: UserRole },
  ) {
    return this.usersService.create(body.username, body.password, body.role);
  }

  @Get()
  async list() {
    return this.usersService.findAll();
  }

  @Post(':id/join/:groupId')
  async joinGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ) {
    return this.usersService.addGroup(id, groupId);
  }
// el id que usamos aqui literalmente lo borré entonces... o agregar uno autogenerado o, ver que otras opciones hay
  @Get(':id/schedule')
  async getSchedule(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) return { error: 'Usuario no encontrado' };

    const groups = await this.groupsService.findMany(user.groupIds);

    return { user: user.username, schedule: groups };
  }
}
