import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PriorityCalculatorService, Priority, PriorityContext } from '../services/priority-calculator.service';

class PriorityTestDto {
  userId: string;
  sourceSubjectId: string;
  targetSubjectId: string;
  studentSemester?: number;
  isSourceMandatory?: boolean;
  isTargetMandatory?: boolean;
  isAddDropPeriod?: boolean;
}

/**
 * PriorityExamplesController - Ejemplos de cálculo de prioridad
 */
@ApiTags('Priority Examples')
@Controller('priority-examples')
export class PriorityExamplesController {
  constructor(private readonly priorityCalculatorService: PriorityCalculatorService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calcular prioridad de solicitud',
    description: 'Calcula la prioridad basada en criterios objetivos.',
  })
  @ApiBody({
    type: PriorityTestDto,
    examples: {
      normal: {
        summary: 'Solicitud normal',
        value: {
          userId: 'user123',
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a1',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a3',
          studentSemester: 5,
          isTargetMandatory: false,
          isAddDropPeriod: false
        }
      },
      high: {
        summary: 'Prioridad alta - Materia obligatoria',
        value: {
          userId: 'user123',
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a1',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a2',
          studentSemester: 6,
          isTargetMandatory: true,
          isAddDropPeriod: false
        }
      },
      urgent: {
        summary: 'Prioridad urgente - Último semestre + obligatoria',
        value: {
          userId: 'user123',
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a1',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a2',
          studentSemester: 11,
          isTargetMandatory: true,
          isAddDropPeriod: false
        }
      },
      low: {
        summary: 'Prioridad baja - Periodo add/drop',
        value: {
          userId: 'user123',
          sourceSubjectId: '60d5ecb8b0a7c4b4b8b9b1a1',
          targetSubjectId: '60d5ecb8b0a7c4b4b8b9b1a3',
          studentSemester: 3,
          isTargetMandatory: false,
          isAddDropPeriod: true
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Prioridad calculada exitosamente',
    schema: {
      type: 'object',
      properties: {
        priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        description: { type: 'string' },
        weight: { type: 'number' },
        criteria: { type: 'object' }
      }
    }
  })
  async calculatePriority(@Body() dto: PriorityTestDto) {
    const context: PriorityContext = {
      ...dto,
      requestDate: new Date()
    };

    const priority = this.priorityCalculatorService.calculatePriority(context);
    const description = this.priorityCalculatorService.getPriorityDescription(priority);
    const weight = this.priorityCalculatorService.getPriorityWeight(priority);

    return {
      priority,
      description,
      weight,
      criteria: {
        studentSemester: dto.studentSemester,
        isTargetMandatory: dto.isTargetMandatory,
        isAddDropPeriod: dto.isAddDropPeriod,
        isLastSemester: dto.studentSemester >= 10,
      }
    };
  }

  @Get('add-drop-status')
  @ApiOperation({
    summary: 'Verificar estado periodo add/drop',
    description: 'Verifica si actualmente es periodo add/drop.',
  })
  async getAddDropStatus() {
    const isAddDrop = this.priorityCalculatorService.isAddDropPeriod();
    
    return {
      isAddDropPeriod: isAddDrop,
      currentDate: new Date().toISOString(),
      description: isAddDrop 
        ? 'Actualmente es periodo add/drop - prioridad reducida'
        : 'No es periodo add/drop - prioridad normal'
    };
  }

  @Get('priority-rules')
  @ApiOperation({
    summary: 'Obtener reglas de prioridad',
    description: 'Lista las reglas y criterios para cálculo de prioridad.',
  })
  async getPriorityRules() {
    return {
      rules: [
        {
          priority: 'URGENT',
          criteria: 'Estudiante último semestre (≥10) + materia obligatoria',
          weight: 4
        },
        {
          priority: 'HIGH', 
          criteria: 'Materia obligatoria O estudiante último semestre',
          weight: 3
        },
        {
          priority: 'NORMAL',
          criteria: 'Solicitud estándar (por defecto)',
          weight: 2
        },
        {
          priority: 'LOW',
          criteria: 'Periodo add/drop',
          weight: 1
        }
      ],
      algorithm: 'FIFO dentro de cada nivel de prioridad',
      notes: [
        'Estudiante último semestre: semestre ≥ 10',
        'Materia obligatoria: determinada por plan de estudios',
        'Periodo add/drop: primeras 2 semanas del semestre'
      ]
    };
  }
}