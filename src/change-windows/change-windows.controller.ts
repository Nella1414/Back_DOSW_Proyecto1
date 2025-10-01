import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ChangeWindowsService } from './services/change-windows.service';
import { CreateChangeWindowDto } from './dto/create-change-window.dto';
import { UpdateChangeWindowDto } from './dto/update-change-window.dto';

@Controller('change-windows')
export class ChangeWindowsController {
  constructor(private readonly changeWindowsService: ChangeWindowsService) {}

  @Post()
  create(@Body() createChangeWindowDto: CreateChangeWindowDto) {
    return this.changeWindowsService.create(createChangeWindowDto);
  }

  @Get()
  findAll() {
    return this.changeWindowsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.changeWindowsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChangeWindowDto: UpdateChangeWindowDto,
  ) {
    return this.changeWindowsService.update(+id, updateChangeWindowDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.changeWindowsService.remove(+id);
  }
}
