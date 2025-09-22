import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GroupSchedualesService } from './group-scheduales.service';
import { CreateGroupSchedualeDto } from './dto/create-group-scheduale.dto';
import { UpdateGroupSchedualeDto } from './dto/update-group-scheduale.dto';

@Controller('group-scheduales')
export class GroupSchedualesController {
  constructor(private readonly groupSchedualesService: GroupSchedualesService) {}

  @Post()
  create(@Body() createGroupSchedualeDto: CreateGroupSchedualeDto) {
    return this.groupSchedualesService.create(createGroupSchedualeDto);
  }

  @Get()
  findAll() {
    return this.groupSchedualesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupSchedualesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupSchedualeDto: UpdateGroupSchedualeDto) {
    return this.groupSchedualesService.update(+id, updateGroupSchedualeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupSchedualesService.remove(+id);
  }
}
