import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RoutingValidatorService, ValidationResult } from '../services/routing-validator.service';
import { CreateChangeRequestDto } from '../../change-requests/dto/create-change-request.dto';
import { ChangeRequestsService } from '../../change-requests/services/change-requests.service';

class ValidationTestDto {
  programId: string;
  requestId: string;
  context?: Record<string, any>;
}

/**
 * RoutingValidationExamplesController - Ejemplos de validación de ruteo
 */
@ApiTags('Routing Validation Examples')
@Controller('routing-validation-examples')
export class RoutingValidationExamplesController {
  constructor(
    private readonly routingValidatorService: RoutingValidatorService,
    private readonly changeRequestsService: ChangeRequestsService,
  ) {}

  @Post('validate-program')
  @ApiOperation({
    summary: 'Validar programa con fallback',
    description: 'Valida un programa y aplica fallback si es necesario.',
  })
  @ApiBody({
    type: ValidationTestDto,
    examples: {
      validProgram: {
        summary: 'Programa válido',
        value: {
          programId: 'PROG-CS',
          requestId: 'test-request-001',
          context: { userId: 'user123', source: 'validation-test' }
        }
      },
      invalidProgram: {
        summary: 'Programa inválido (requiere fallback)',
        value: {
          programId: 'PROG-INVALID',
          requestId: 'test-request-002',
          context: { userId: 'user456', source: 'validation-test' }
        }
      },
      inactiveProgram: {
        summary: 'Programa inactivo (requiere fallback)',
        value: {
          programId: 'PROG-INACTIVE',
          requestId: 'test-request-003',
          context: { userId: 'user789', source: 'validation-test' }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        assignedProgramId: { type: 'string' },
        fallbackUsed: { type: 'boolean' },
        reason: { type: 'string' },
        shouldNotifyAdmins: { type: 'boolean' }
      }
    }
  })
  async validateProgram(@Body() dto: ValidationTestDto) {
    const validationResult = await this.routingValidatorService.validateAndEnsureProgram(
      dto.programId,
      dto.requestId,
      dto.context || {}
    );

    const shouldNotifyAdmins = this.routingValidatorService.shouldNotifyAdmins(validationResult);

    return {
      ...validationResult,
      shouldNotifyAdmins,
      originalProgramId: dto.programId,
      testContext: dto.context
    };
  }

  @Post('create-with-validation')
  @ApiOperation({
    summary: 'Crear solicitud con validación completa',
    description: 'Crea una solicitud aplicando ruteo y validación con fallback automático.',
  })
  @ApiBody({
    type: CreateChangeRequestDto,
    examples: {
      normalRequest: {
        summary: 'Solicitud normal (programa válido)',
        value: {
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a0',
          sourceGroupId: '60d5ecb8b0a7c4b4b8b9b1a1',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a2',
          targetGroupId: '60d5ecb8b0a7c4b4b8b9b1a3',
          reason: 'Solicitud con validación normal'
        }
      },
      fallbackRequest: {
        summary: 'Solicitud que requiere fallback',
        value: {
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1ax',
          sourceGroupId: '60d5ecb8b0a7c4b4b8b9b1ay',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1az',
          targetGroupId: '60d5ecb8b0a7c4b4b8b9b1aw',
          reason: 'Solicitud que activará fallback'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada con validación',
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
            status: { type: 'string' }
          }
        },
        auditEvents: { type: 'array' },
        validationApplied: { type: 'boolean' },
        fallbackUsed: { type: 'boolean' }
      }
    }
  })
  async createWithValidation(@Body() createDto: CreateChangeRequestDto) {
    const userId = 'validation-test-user';
    const ipAddress = '127.0.0.1';
    const userAgent = 'Validation Test Client';

    // Crear solicitud (incluye ruteo y validación automática)
    const request = await this.changeRequestsService.create(
      createDto,
      userId,
      ipAddress,
      userAgent,
    );

    // Obtener historial de auditoría para verificar eventos
    const auditHistory = await this.changeRequestsService['auditService'].getAuditHistory(
      (request._id as any).toString()
    );

    const fallbackEvent = auditHistory.find(event => event.eventType === 'FALLBACK');

    return {
      request: {
        _id: request._id,
        radicado: request.radicado,
        assignedProgramId: request.assignedProgramId,
        priority: request.priority,
        status: request.status,
        createdAt: request.createdAt,
      },
      auditEvents: auditHistory.map(event => ({
        eventType: event.eventType,
        timestamp: event.timestamp,
        actorId: event.actorId,
      })),
      validationApplied: true,
      fallbackUsed: !!fallbackEvent,
      fallbackDetails: fallbackEvent?.requestDetails || null,
    };
  }

  @Get('validation-stats')
  @ApiOperation({
    summary: 'Estadísticas de validación',
    description: 'Obtiene información sobre las reglas y configuración de validación.',
  })
  async getValidationStats() {
    const stats = this.routingValidatorService.getValidationStats();
    const defaultProgram = this.routingValidatorService.getDefaultProgram();

    return {
      ...stats,
      currentDefaultProgram: defaultProgram,
      validationFlow: [
        '1. Verificar que programa existe',
        '2. Verificar que programa está activo',
        '3. Si falla, aplicar programa por defecto',
        '4. Si programa por defecto falla, usar programa de emergencia',
        '5. Registrar evento FALLBACK en auditoría',
        '6. Notificar administradores si es necesario'
      ]
    };
  }

  @Get('fallback-cases')
  @ApiOperation({
    summary: 'Casos que requieren fallback',
    description: 'Lista los casos que activan el mecanismo de fallback.',
  })
  async getFallbackCases() {
    return {
      fallbackTriggers: [
        {
          case: 'PROGRAM_NOT_EXISTS',
          description: 'El programa asignado no existe en el sistema',
          action: 'Usar programa por defecto',
          example: 'PROG-INVALID → PROG-ADMIN'
        },
        {
          case: 'PROGRAM_INACTIVE',
          description: 'El programa existe pero está inactivo',
          action: 'Usar programa por defecto',
          example: 'PROG-SUSPENDED → PROG-ADMIN'
        },
        {
          case: 'DEFAULT_INVALID',
          description: 'El programa por defecto también es inválido',
          action: 'Usar programa de emergencia',
          example: 'PROG-ADMIN inválido → PROG-EMERGENCY'
        }
      ],
      testPrograms: {
        valid: ['PROG-CS', 'PROG-ING', 'PROG-MAT', 'PROG-FIS', 'PROG-ADMIN'],
        invalid: ['PROG-INVALID', 'PROG-NONEXISTENT'],
        inactive: ['PROG-INACTIVE', 'PROG-SUSPENDED'],
        default: 'PROG-ADMIN',
        emergency: 'PROG-EMERGENCY'
      },
      auditingEnabled: true,
      adminNotificationEnabled: true
    };
  }
}