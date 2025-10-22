import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { CreateChangeRequestDto } from '../../change-requests/dto/create-change-request.dto';
import { ChangeRequestsService } from '../../change-requests/services/change-requests.service';

/**
 * RouteAssignedExamplesController - Ejemplos de auditoría ROUTE_ASSIGNED
 */
@ApiTags('Route Assigned Examples')
@Controller('route-assigned-examples')
export class RouteAssignedExamplesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly changeRequestsService: ChangeRequestsService,
  ) {}

  @Post('create-with-route-audit')
  @ApiOperation({
    summary: 'Crear solicitud con auditoría ROUTE_ASSIGNED completa',
    description: 'Demuestra cómo se registra automáticamente el evento ROUTE_ASSIGNED con información completa para troubleshooting.',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada con evento ROUTE_ASSIGNED registrado',
    schema: {
      type: 'object',
      properties: {
        request: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            radicado: { type: 'string' },
            assignedProgramId: { type: 'string' },
            priority: { type: 'string' },
            status: { type: 'string' },
          },
        },
        routeAssignedEvent: {
          type: 'object',
          properties: {
            eventType: { type: 'string', example: 'ROUTE_ASSIGNED' },
            finalProgramId: { type: 'string' },
            routingDecision: { type: 'object' },
            validationResult: { type: 'object' },
            troubleshootingInfo: { type: 'object' },
          },
        },
        allAuditEvents: { type: 'array' },
      },
    },
  })
  async createWithRouteAudit(@Body() createDto: CreateChangeRequestDto) {
    const userId = 'route-audit-test-user';
    const ipAddress = '127.0.0.1';
    const userAgent = 'Route Audit Test Client';

    // Crear solicitud (genera todos los eventos automáticamente)
    const request = await this.changeRequestsService.create(
      createDto,
      userId,
      ipAddress,
      userAgent,
    );

    // Obtener historial completo de auditoría
    const auditHistory = await this.auditService.getAuditHistory((request._id as any).toString());

    // Encontrar evento ROUTE_ASSIGNED específico
    const routeAssignedEvent = auditHistory.find(event => event.eventType === 'ROUTE_ASSIGNED');

    return {
      request: {
        _id: request._id,
        radicado: request.radicado,
        assignedProgramId: request.assignedProgramId,
        priority: request.priority,
        status: request.status,
        createdAt: request.createdAt,
      },
      routeAssignedEvent: routeAssignedEvent ? {
        eventType: routeAssignedEvent.eventType,
        timestamp: routeAssignedEvent.timestamp,
        actorId: routeAssignedEvent.actorId,
        finalProgramId: routeAssignedEvent.requestDetails?.finalProgramId,
        routingDecision: routeAssignedEvent.requestDetails?.routingDecision,
        validationResult: routeAssignedEvent.requestDetails?.validationResult,
        troubleshootingInfo: routeAssignedEvent.requestDetails?.troubleshootingInfo,
      } : null,
      allAuditEvents: auditHistory.map(event => ({
        eventType: event.eventType,
        timestamp: event.timestamp,
        actorId: event.actorId,
      })),
      totalEvents: auditHistory.length,
    };
  }

  @Post('manual-route-assigned')
  @ApiOperation({
    summary: 'Registrar evento ROUTE_ASSIGNED manualmente',
    description: 'Demuestra cómo registrar manualmente un evento ROUTE_ASSIGNED con información completa.',
  })
  async manualRouteAssigned() {
    const mockRequestId = 'manual-route-assigned-123';
    const finalProgramId = 'PROG-CS';
    
    const routingDecision = {
      originalRule: 'SAME_PROGRAM',
      originalReason: 'Ambas materias pertenecen al programa PROG-CS',
      originalProgramId: 'PROG-CS',
    };

    const validationResult = {
      validationPassed: true,
      fallbackUsed: false,
      fallbackReason: null,
      finalProgramId: 'PROG-CS',
    };

    const troubleshootingInfo = {
      userId: 'manual-test-user',
      sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a0',
      targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a2',
      sourceSubjectProgram: 'PROG-CS',
      targetSubjectProgram: 'PROG-CS',
      studentProgramId: 'PROG-ING',
      routingTimestamp: new Date(),
      radicado: '2024-999999',
      priority: 'HIGH',
    };

    const auditEvent = await this.auditService.logRouteAssignedEvent(
      mockRequestId,
      finalProgramId,
      routingDecision,
      validationResult,
      troubleshootingInfo,
    );

    return {
      message: 'Evento ROUTE_ASSIGNED registrado manualmente',
      auditEvent: {
        eventType: auditEvent.eventType,
        requestId: auditEvent.requestId,
        timestamp: auditEvent.timestamp,
        actorId: auditEvent.actorId,
        details: auditEvent.requestDetails,
      },
    };
  }

  @Get('route-assigned-events')
  @ApiOperation({
    summary: 'Obtener eventos ROUTE_ASSIGNED',
    description: 'Lista todos los eventos de tipo ROUTE_ASSIGNED para análisis.',
  })
  async getRouteAssignedEvents() {
    // Buscar eventos ROUTE_ASSIGNED
    const routeAssignedEvents = await this.auditService['auditModel']
      .find({ eventType: 'ROUTE_ASSIGNED' })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    return {
      totalEvents: routeAssignedEvents.length,
      events: routeAssignedEvents.map(event => ({
        requestId: event.requestId,
        timestamp: event.timestamp,
        finalProgramId: event.requestDetails?.finalProgramId,
        routingRule: event.requestDetails?.routingDecision?.originalRule,
        fallbackUsed: event.requestDetails?.validationResult?.fallbackUsed,
        troubleshootingData: {
          sourceProgram: event.requestDetails?.troubleshootingInfo?.sourceSubjectProgram,
          targetProgram: event.requestDetails?.troubleshootingInfo?.targetSubjectProgram,
          studentProgram: event.requestDetails?.troubleshootingInfo?.studentProgramId,
          radicado: event.requestDetails?.troubleshootingInfo?.radicado,
          priority: event.requestDetails?.troubleshootingInfo?.priority,
        },
        createdAt: event.createdAt,
      })),
    };
  }

  @Get('troubleshooting-info/:requestId')
  @ApiOperation({
    summary: 'Obtener información de troubleshooting',
    description: 'Extrae información específica para troubleshooting de ruteo de una solicitud.',
  })
  async getTroubleshootingInfo(@Param('requestId') requestId: string) {
    const auditHistory = await this.auditService.getAuditHistory(requestId);
    
    const routeAssignedEvent = auditHistory.find(event => event.eventType === 'ROUTE_ASSIGNED');
    const fallbackEvent = auditHistory.find(event => event.eventType === 'FALLBACK');
    const routeEvent = auditHistory.find(event => event.eventType === 'ROUTE');

    if (!routeAssignedEvent) {
      return {
        requestId,
        error: 'No se encontró evento ROUTE_ASSIGNED para esta solicitud',
        availableEvents: auditHistory.map(e => e.eventType),
      };
    }

    const troubleshootingData = routeAssignedEvent.requestDetails?.troubleshootingInfo;
    const routingDecision = routeAssignedEvent.requestDetails?.routingDecision;
    const validationResult = routeAssignedEvent.requestDetails?.validationResult;

    return {
      requestId,
      finalProgram: routeAssignedEvent.requestDetails?.finalProgramId,
      routingFlow: {
        step1_initialRouting: {
          rule: routingDecision?.originalRule,
          reason: routingDecision?.originalReason,
          proposedProgram: routingDecision?.originalProgramId,
        },
        step2_validation: {
          passed: validationResult?.validationPassed,
          fallbackUsed: validationResult?.fallbackUsed,
          fallbackReason: validationResult?.fallbackReason,
          finalProgram: validationResult?.finalProgramId,
        },
        step3_assignment: {
          assignedProgram: routeAssignedEvent.requestDetails?.finalProgramId,
          timestamp: routeAssignedEvent.timestamp,
        },
      },
      contextData: {
        user: troubleshootingData?.userId,
        sourceSubject: {
          id: troubleshootingData?.sourceSubjectId,
          program: troubleshootingData?.sourceSubjectProgram,
        },
        targetSubject: {
          id: troubleshootingData?.targetSubjectId,
          program: troubleshootingData?.targetSubjectProgram,
        },
        student: {
          program: troubleshootingData?.studentProgramId,
        },
        request: {
          radicado: troubleshootingData?.radicado,
          priority: troubleshootingData?.priority,
        },
      },
      relatedEvents: {
        hasRouteEvent: !!routeEvent,
        hasFallbackEvent: !!fallbackEvent,
        totalAuditEvents: auditHistory.length,
      },
    };
  }
}