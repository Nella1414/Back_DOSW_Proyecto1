import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { GroupsService } from './groups.service';

@ApiTags('Grupos')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear grupo' })
  @ApiBody({ schema: { properties: { subjectId: { type: 'string' }, code: { type: 'string' }, schedule: { type: 'string' }, capacity: { type: 'number' } } } })
  async create(
    @Body() body: { subjectId: string; code: string; schedule: string; capacity: number },
  ) {
    return this.groupsService.create(body.subjectId, body.code, body.schedule, body.capacity);
  }

  @Get()
  @ApiOperation({ summary: 'Listar grupos' })
  async list() {
    return this.groupsService.findAll();
  }
}
