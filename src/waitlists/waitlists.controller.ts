import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WaitlistsService } from './waitlists.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';

@Controller('waitlists')
export class WaitlistsController {
  constructor(private readonly waitlistsService: WaitlistsService) {}

  @Post()
  create(@Body() createWaitlistDto: CreateWaitlistDto) {
    return this.waitlistsService.create(createWaitlistDto);
  }

  @Get()
  findAll() {
    return this.waitlistsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.waitlistsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWaitlistDto: UpdateWaitlistDto) {
    return this.waitlistsService.update(+id, updateWaitlistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.waitlistsService.remove(+id);
  }
}
