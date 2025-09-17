import { Body, Controller, Get, Post } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(
    @Body() body: { subjectId: string; code: string; schedule: string; capacity: number },
  ) {
    return this.groupsService.create(body.subjectId, body.code, body.schedule, body.capacity);
  }

  @Get()
  async list() {
    return this.groupsService.findAll();
  }
}
