import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AcademicTrafficLightService } from './academic-traffic-light.service';
import { CreateAcademicTrafficLightDto } from './dto/create-academic-traffic-light.dto';
import { UpdateAcademicTrafficLightDto } from './dto/update-academic-traffic-light.dto';

@Controller('academic-traffic-light')
export class AcademicTrafficLightController {
  constructor(private readonly academicTrafficLightService: AcademicTrafficLightService) {}

  @Post()
  create(@Body() createAcademicTrafficLightDto: CreateAcademicTrafficLightDto) {
    return this.academicTrafficLightService.create(createAcademicTrafficLightDto);
  }

  @Get()
  findAll() {
    return this.academicTrafficLightService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicTrafficLightService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAcademicTrafficLightDto: UpdateAcademicTrafficLightDto) {
    return this.academicTrafficLightService.update(+id, updateAcademicTrafficLightDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.academicTrafficLightService.remove(+id);
  }
}
