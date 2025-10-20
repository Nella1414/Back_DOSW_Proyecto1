import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { CreateChangeRequestDto } from '../../change-requests/dto/create-change-request.dto';
import { ChangeRequestsService } from '../../change-requests/services/change-requests.service';

/**
 * AuditRadicateExamplesController - Ejemplos de auditoría de radicación
 */
@ApiTags('Audit Radicate Examples')
@Controller('audit-radicate-examples')
export class AuditRadicateExamplesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly changeRequestsService: ChangeRequestsService,
  ) {}

  @Post('create-with-radicate')
  @ApiOperation({
    summary: 'Crear solicitud con auditoría RADICATE automática',
    description: 'Demuestra cómo se registra automáticamente el evento RADICATE al asignar radicado y prioridad.',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada con eventos CREATE y RADICATE registrados',
    schema: {
      type: 'object',
      properties: {
        request: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            radicado: { type: 'string', example: '2024-000001' },
            priority: { type: 'string', example: 'HIGH' },
            status: { type: 'string', example: 'PENDING' },
          },
        },
        auditEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventType: { type: 'string' },
              timestamp: { type: 'string' },
              actorId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async createWithRadicateAudit(@Body() createDto: CreateChangeRequestDto) {
    const userId = 'audit-test-user';
    const ipAddress = '127.0.0.1';
    const userAgent = 'Audit Test Client';

    // Crear solicitud (genera eventos CREATE y RADICATE automáticamente)
    const request = await this.changeRequestsService.create(
      createDto,
      userId,
      ipAddress,
      userAgent,
    );

    // Obtener historial de auditoría
    const auditHistory = await this.auditService.getAuditHistory(request._id.toString());

    return {
      request: {
        _id: request._id,
        radicado: request.radicado,
        priority: request.priority,
        status: request.status,
        createdAt: request.createdAt,
      },
      auditEvents: auditHistory.map(event => ({
        eventType: event.eventType,
        timestamp: event.timestamp,
        actorId: event.actorId,
        details: event.requestDetails,
      })),
    };
  }

  @Post('manual-radicate-audit')
  @ApiOperation({
    summary: 'Registrar evento RADICATE manualmente',
    description: 'Demuestra cómo registrar manualmente un evento RADICATE.',
  })
  async manualRadicateAudit() {
    const mockRequestId = 'manual-radicate-test-123';
    const radicado = '2024-999999';
    const priority = 'URGENT';
    const priorityCriteria = {
      studentSemester: 12,
      isTargetMandatory: true,
      isAddDropPeriod: false,
      calculationDate: new Date(),
      priorityDescription: 'Prioridad urgente - Estudiante próximo a graduar con materia obligatoria',
      priorityWeight: 4,
    };

    const auditEvent = await this.auditService.logRadicateEvent(
      mockRequestId,
      radicado,
      priority,
      priorityCriteria,
    );

    return {
      message: 'Evento RADICATE registrado manualmente',
      auditEvent: {
        eventType: auditEvent.eventType,
        requestId: auditEvent.requestId,
        timestamp: auditEvent.timestamp,
        actorId: auditEvent.actorId,
        details: auditEvent.requestDetails,
      },
    };
  }

  @Get('audit-history/:requestId')
  @ApiOperation({
    summary: 'Obtener historial completo de auditoría',
    description: 'Muestra todos los eventos de auditoría para una solicitud, incluyendo RADICATE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de auditoría completo',
    schema: {
      type: 'object',
      properties: {
        requestId: { type: 'string' },
        totalEvents: { type: 'number' },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventType: { type: 'string' },
              timestamp: { type: 'string' },
              actorId: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
  })
  async getAuditHistory(@Param('requestId') requestId: string) {
    const auditHistory = await this.auditService.getAuditHistory(requestId);

    return {
      requestId,
      totalEvents: auditHistory.length,
      events: auditHistory.map(event => ({
        eventType: event.eventType,
        timestamp: event.timestamp,
        actorId: event.actorId,
        details: event.requestDetails,
        createdAt: event.createdAt,
      })),
      eventTypes: [...new Set(auditHistory.map(e => e.eventType))],
    };
  }

  @Get('radicate-events')
  @ApiOperation({
    summary: 'Obtener solo eventos RADICATE',
    description: 'Filtra y muestra únicamente los eventos de tipo RADICATE.',
  })
  async getRadicateEvents() {
    // Buscar todos los eventos RADICATE
    const radicateEvents = await this.auditService['auditModel']
      .find({ eventType: 'RADICATE' })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    return {
      totalRadicateEvents: radicateEvents.length,
      events: radicateEvents.map(event => ({
        requestId: event.requestId,
        timestamp: event.timestamp,
        radicado: event.requestDetails?.radicado,
        priority: event.requestDetails?.priority,
        priorityCriteria: event.requestDetails?.priorityCriteria,
        createdAt: event.createdAt,
      })),
    };
  }
}