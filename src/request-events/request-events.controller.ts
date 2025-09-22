import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RequestEventsService } from './request-events.service';
import { CreateRequestEventDto } from './dto/create-request-event.dto';
import { UpdateRequestEventDto } from './dto/update-request-event.dto';

@Controller('request-events')
export class RequestEventsController {
  constructor(private readonly requestEventsService: RequestEventsService) {}

  @Post()
  create(@Body() createRequestEventDto: CreateRequestEventDto) {
    return this.requestEventsService.create(createRequestEventDto);
  }

  @Get()
  findAll() {
    return this.requestEventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestEventsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRequestEventDto: UpdateRequestEventDto) {
    return this.requestEventsService.update(+id, updateRequestEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestEventsService.remove(+id);
  }
}
