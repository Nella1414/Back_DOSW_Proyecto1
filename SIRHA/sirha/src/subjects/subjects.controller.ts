import { Body, Controller, Get, Post } from '@nestjs/common';
import { SubjectsService } from './subjects.service';

@Controller('subjects')
export class SubjectsController {
  constructor(private s: SubjectsService) {}

  @Post()
  create(@Body() body: { code: string; name: string }) {
    return this.s.create(body.code, body.name);
  }

  @Get()
  list() { return this.s.findAll(); }
}
