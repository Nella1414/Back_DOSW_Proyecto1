import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateChangeRequestDto } from '../../change-requests/dto/create-change-request.dto';
import { ChangeRequestsService } from '../../change-requests/services/change-requests.service';
import { AuditCreate } from '../decorators/audit-create.decorator';

/**
 * ChangeRequestExamplesController - Ejemplos de solicitudes de cambio
 */
@ApiTags('Change Request Examples')
@Controller('change-request-examples')
export class ChangeRequestExamplesController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Ejemplo de creación de solicitud de cambio',
    description: 'Demuestra el sistema anti-duplicados y auditoría automática.',
  })
  @ApiBody({
    type: CreateChangeRequestDto,
    examples: {
      valid: {
        summary: 'Solicitud válida',
        value: {
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a1',
          sourceGroupId: '60d5ecb8b0a7c4b4b8b9b1a2',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a3',
          targetGroupId: '60d5ecb8b0a7c4b4b8b9b1a4',
          reason: 'Conflicto de horario',
          observations: 'Necesito cambiar por motivos laborales'
        }
      },
      duplicate: {
        summary: 'Solicitud duplicada (mismo día)',
        value: {
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a1',
          sourceGroupId: '60d5ecb8b0a7c4b4b8b9b1a2',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a3',
          targetGroupId: '60d5ecb8b0a7c4b4b8b9b1a4',
          reason: 'Mismo cambio del ejemplo anterior'
        }
      },
      invalid: {
        summary: 'Datos inválidos (origen = destino)',
        value: {
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a1',
          sourceGroupId: '60d5ecb8b0a7c4b4b8b9b1a2',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a1',
          targetGroupId: '60d5ecb8b0a7c4b4b8b9b1a4'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente' })
  @ApiResponse({ status: 200, description: 'Solicitud duplicada - retorna existente' })
  @ApiResponse({ status: 422, description: 'Datos de validación inválidos' })
  @AuditCreate('change_request')
  async createExample(@Body() dto: CreateChangeRequestDto, @Req() req: any) {
    const userId = 'example-user-123';
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Test Client';

    return this.changeRequestsService.create(dto, userId, ipAddress, userAgent);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Obtener solicitudes de usuario',
    description: 'Lista todas las solicitudes de cambio de un usuario.',
  })
  async getUserRequests(@Param('userId') userId: string) {
    return this.changeRequestsService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener solicitud por ID',
    description: 'Obtiene los detalles de una solicitud específica.',
  })
  async getRequest(@Param('id') id: string) {
    return this.changeRequestsService.findOne(id);
  }
}