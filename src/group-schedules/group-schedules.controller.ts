import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GroupSchedulesService } from './services/group-schedules.service';
import { CreateGroupScheduleDto } from './dto/create-group-schedule.dto';
import { UpdateGroupScheduleDto } from './dto/update-group-schedule.dto';

@Controller('group-schedules')
export class GroupSchedulesController {
  constructor(private readonly groupSchedulesService: GroupSchedulesService) {}

  @Post()
  create(@Body() createGroupScheduleDto: CreateGroupScheduleDto) {
    return this.groupSchedulesService.create(createGroupScheduleDto);
  }

  @Get()
  findAll() {
    return this.groupSchedulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupSchedulesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGroupScheduleDto: UpdateGroupScheduleDto,
  ) {
    return this.groupSchedulesService.update(+id, updateGroupScheduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupSchedulesService.remove(+id);
  }
}
