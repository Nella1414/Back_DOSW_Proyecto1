import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChangeRequestsService } from './change-requests.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { UpdateChangeRequestDto } from './dto/update-change-request.dto';

@Controller('change-requests')
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @Post()
  create(@Body() createChangeRequestDto: CreateChangeRequestDto) {
    return this.changeRequestsService.create(createChangeRequestDto);
  }

  @Get()
  findAll() {
    return this.changeRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.changeRequestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChangeRequestDto: UpdateChangeRequestDto) {
    return this.changeRequestsService.update(+id, updateChangeRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.changeRequestsService.remove(+id);
  }
}
