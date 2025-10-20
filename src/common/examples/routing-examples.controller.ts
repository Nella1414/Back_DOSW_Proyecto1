import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RoutingService, RoutingContext } from '../services/routing.service';

class RoutingTestDto {
  userId: string;
  sourceSubjectId: string;
  targetSubjectId: string;
  studentProgramId?: string;
}

/**
 * RoutingExamplesController - Ejemplos de ruteo automático
 */
@ApiTags('Routing Examples')
@Controller('routing-examples')
export class RoutingExamplesController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('determine-program')
  @ApiOperation({
    summary: 'Determinar programa para solicitud',
    description: 'Calcula automáticamente a qué programa asignar una solicitud basado en las materias.',
  })
  @ApiBody({
    type: RoutingTestDto,
    examples: {
      sameProgram: {
        summary: 'Ambas materias del mismo programa',
        value: {
          userId: 'user123',
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a0',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a2',
          studentProgramId: 'PROG-ING'
        }
      },
      differentPrograms: {
        summary: 'Materias de diferentes programas',
        value: {
          userId: 'user123',
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a0',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a4',
          studentProgramId: 'PROG-ADMIN'
        }
      },
      fallbackStudent: {
        summary: 'Fallback al programa del estudiante',
        value: {
          userId: 'user123',
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1ax',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1ay',
          studentProgramId: 'PROG-CS'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Programa determinado exitosamente',
    schema: {
      type: 'object',
      properties: {
        assignedProgramId: { type: 'string', example: 'PROG-CS' },
        reason: { type: 'string' },
        rule: { type: 'string', enum: ['SAME_PROGRAM', 'TARGET_PROGRAM', 'SOURCE_PROGRAM', 'STUDENT_PROGRAM'] },
        context: { type: 'object' }
      }
    }
  })
  async determineProgram(@Body() dto: RoutingTestDto) {
    const context: RoutingContext = {
      userId: dto.userId,
      sourceSubjectId: dto.sourceSubjectId,
      targetSubjectId: dto.targetSubjectId,
      studentProgramId: dto.studentProgramId
    };

    const decision = await this.routingService.determineProgram(context);

    return {
      ...decision,
      context: {
        userId: dto.userId,
        sourceSubjectId: dto.sourceSubjectId,
        targetSubjectId: dto.targetSubjectId,
        studentProgramId: dto.studentProgramId
      }
    };
  }

  @Get('routing-rules')
  @ApiOperation({
    summary: 'Obtener reglas de ruteo',
    description: 'Lista las reglas y criterios para asignación automática de programas.',
  })
  async getRoutingRules() {
    return {
      rules: [
        {
          priority: 1,
          rule: 'SAME_PROGRAM',
          description: 'Si ambas materias pertenecen al mismo programa → ese programa',
          example: 'Materia origen: PROG-CS, Materia destino: PROG-CS → PROG-CS'
        },
        {
          priority: 2,
          rule: 'TARGET_PROGRAM',
          description: 'Si materias de diferentes programas → programa de materia destino',
          example: 'Materia origen: PROG-CS, Materia destino: PROG-ING → PROG-ING'
        },
        {
          priority: 3,
          rule: 'SOURCE_PROGRAM',
          description: 'Si solo materia origen tiene programa → programa origen',
          example: 'Materia origen: PROG-CS, Materia destino: sin programa → PROG-CS'
        },
        {
          priority: 4,
          rule: 'STUDENT_PROGRAM',
          description: 'Fallback: programa del estudiante',
          example: 'Ninguna materia tiene programa → programa del estudiante'
        }
      ],
      programMapping: {
        'IDs terminados en 0,1': 'PROG-CS (Ciencias de la Computación)',
        'IDs terminados en 2,3': 'PROG-ING (Ingeniería)',
        'IDs terminados en 4,5': 'PROG-MAT (Matemáticas)',
        'IDs terminados en 6,7': 'PROG-FIS (Física)',
        'IDs terminados en 8,9': 'PROG-ADMIN (Administración)'
      },
      notes: [
        'El ruteo es determinístico - mismos inputs producen mismo resultado',
        'Se evalúan las reglas en orden de prioridad',
        'La primera regla que aplique determina el programa',
        'Siempre hay un programa asignado (fallback garantizado)'
      ]
    };
  }

  @Get('routing-stats')
  @ApiOperation({
    summary: 'Estadísticas de ruteo',
    description: 'Obtiene estadísticas sobre las reglas de ruteo utilizadas.',
  })
  async getRoutingStats() {
    const stats = this.routingService.getRoutingStats();
    
    return {
      availableRules: stats,
      totalRules: Object.keys(stats).length,
      description: 'Reglas disponibles para ruteo automático de solicitudes'
    };
  }

  @Post('validate-program')
  @ApiOperation({
    summary: 'Validar programa',
    description: 'Verifica si un programa existe en el sistema.',
  })
  async validateProgram(@Body() body: { programId: string }) {
    const isValid = await this.routingService.validateProgram(body.programId);
    
    return {
      programId: body.programId,
      isValid,
      message: isValid 
        ? 'Programa válido en el sistema'
        : 'Programa no encontrado en el sistema'
    };
  }
}