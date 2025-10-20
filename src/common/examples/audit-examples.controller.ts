import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { CreateStudentDto } from '../../students/dto/create-student.dto';
import { AuditCreate } from '../decorators/audit-create.decorator';

/**
 * AuditExamplesController - Ejemplos de auditoría de eventos
 */
@ApiTags('Audit Examples')
@Controller('audit-examples')
export class AuditExamplesController {
  constructor(private readonly auditService: AuditService) {}

  @Post('student')
  @ApiOperation({
    summary: 'Ejemplo de creación con auditoría automática',
    description: 'Demuestra cómo se registra automáticamente un evento CREATE en la auditoría.',
  })
  @AuditCreate('student')
  @ApiResponse({ status: 201, description: 'Estudiante creado y evento auditado' })
  async createStudentWithAudit(@Body() createStudentDto: CreateStudentDto) {
    // Simular creación de estudiante
    const mockStudent = {
      id: '60d5ecb8b0a7c4b4b8b9b1a4',
      ...createStudentDto,
      createdAt: new Date(),
    };

    return mockStudent;
  }

  @Get('history/:requestId')
  @ApiOperation({
    summary: 'Obtener historial de auditoría',
    description: 'Recupera el historial completo de auditoría para una solicitud específica.',
  })
  @ApiResponse({ status: 200, description: 'Historial de auditoría recuperado' })
  async getAuditHistory(@Param('requestId') requestId: string) {
    return this.auditService.getAuditHistory(requestId);
  }

  @Post('manual-audit')
  @ApiOperation({
    summary: 'Ejemplo de auditoría manual',
    description: 'Demuestra cómo registrar manualmente un evento de auditoría.',
  })
  async manualAuditExample() {
    const auditEvent = await this.auditService.logCreateEvent(
      'manual-request-123',
      'user-456',
      {
        entityType: 'example',
        action: 'manual_creation',
        data: { example: 'data' },
      },
      '192.168.1.1',
      'Mozilla/5.0 (Example Browser)',
    );

    return {
      message: 'Evento de auditoría registrado manualmente',
      auditEvent,
    };
  }
}