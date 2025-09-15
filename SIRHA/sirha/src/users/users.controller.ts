import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { GroupsService } from '../groups/groups.service';
import { UserRole } from '../common/interfaces';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private groupsService: GroupsService,
  ) {}

  @Post('register')
  register(@Body() body: { username: string; password: string; role?: UserRole }) {
    return this.usersService.create(body.username, body.password, body.role);
  }

  @Get()
  list() { return this.usersService.findAll(); }

  // Inscribir estudiante en un grupo
  @Post(':id/join/:groupId')
  joinGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.usersService.addGroup(id, groupId);
  }

  // Consultar horario del estudiante
  @Get(':id/schedule')
  getSchedule(@Param('id', ParseIntPipe) id: number) {
    const user = this.usersService.findById(id);
    if (!user) return { error: 'Usuario no encontrado' };
    const groups = this.groupsService.findMany(user.groupIds);
    return { user: user.username, schedule: groups };
  }
}
