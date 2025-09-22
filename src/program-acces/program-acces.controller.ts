import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProgramAccesService } from './program-acces.service';
import { CreateProgramAcceDto } from './dto/create-program-acce.dto';
import { UpdateProgramAcceDto } from './dto/update-program-acce.dto';

@Controller('program-acces')
export class ProgramAccesController {
  constructor(private readonly programAccesService: ProgramAccesService) {}

  @Post()
  create(@Body() createProgramAcceDto: CreateProgramAcceDto) {
    return this.programAccesService.create(createProgramAcceDto);
  }

  @Get()
  findAll() {
    return this.programAccesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programAccesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProgramAcceDto: UpdateProgramAcceDto) {
    return this.programAccesService.update(+id, updateProgramAcceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programAccesService.remove(+id);
  }
}
