import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  create(@Body() body: { studentId: string; fromGroupId: string; toGroupId: string }) {
    return this.requestsService.create(body.studentId, body.fromGroupId, body.toGroupId);
  }

  @Get()
  list() {
    return this.requestsService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.requestsService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'pending' | 'approved' | 'rejected' }) {
    return this.requestsService.updateStatus(id, body.status);
  }
}
