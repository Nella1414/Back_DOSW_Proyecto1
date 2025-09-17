import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { RequestsService } from './requests.service';

@ApiTags('Solicitudes')
@Controller('requests')
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear solicitud de cambio de grupo' })
  @ApiBody({ schema: { properties: { studentId: { type: 'string' }, fromGroupId: { type: 'string' }, toGroupId: { type: 'string' } } } })
  create(@Body() body: { studentId: string; fromGroupId: string; toGroupId: string }) {
    return this.requestsService.create(body.studentId, body.fromGroupId, body.toGroupId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes' })
  list() {
    return this.requestsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener solicitud por ID' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  getOne(@Param('id') id: string) {
    return this.requestsService.findById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de la solicitud' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: ['pending', 'approved', 'rejected'] } } } })
  updateStatus(@Param('id') id: string, @Body() body: { status: 'pending' | 'approved' | 'rejected' }) {
    return this.requestsService.updateStatus(id, body.status);
  }
}
