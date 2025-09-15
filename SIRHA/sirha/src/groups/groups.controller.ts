import { Body, Controller, Get, Post } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  create(@Body() body: { subjectId: number; code: string; schedule: string; capacity: number }) {
    return this.groupsService.create(body.subjectId, body.code, body.schedule, body.capacity);
  }

  @Get()
  list() { return this.groupsService.findAll(); }
}
