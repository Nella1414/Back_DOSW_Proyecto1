import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateStudentDto } from '../../students/dto/create-student.dto';

/**
 * ObservationsExamplesController - Ejemplos de persistencia de observaciones
 */
@ApiTags('Observations Examples')
@Controller('observations-examples')
export class ObservationsExamplesController {

  @Post('student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejemplo de persistencia de observaciones',
    description: 'Demuestra cómo se sanitizan y persisten las observaciones de forma segura.',
  })
  @ApiBody({
    type: CreateStudentDto,
    examples: {
      withObservations: {
        summary: 'Con observaciones válidas',
        value: {
          code: 'EST001',
          firstName: 'Juan',
          lastName: 'Pérez',
          programId: '60d5ecb8b0a7c4b4b8b9b1a1',
          observations: 'Estudiante destacado en matemáticas.\nRequiere apoyo en inglés.'
        }
      },
      withHtml: {
        summary: 'Con HTML peligroso (se sanitiza)',
        value: {
          code: 'EST002',
          firstName: 'María',
          lastName: 'García',
          programId: '60d5ecb8b0a7c4b4b8b9b1a1',
          observations: '<script>alert("hack")</script>Estudiante <b>excelente</b>.\n<img src="x" onerror="alert(1)">Muy responsable.'
        }
      },
      withEmpty: {
        summary: 'Con observaciones vacías (se convierte a null)',
        value: {
          code: 'EST003',
          firstName: 'Carlos',
          lastName: 'López',
          programId: '60d5ecb8b0a7c4b4b8b9b1a1',
          observations: ''
        }
      },
      withNull: {
        summary: 'Con observaciones null',
        value: {
          code: 'EST004',
          firstName: 'Ana',
          lastName: 'Martínez',
          programId: '60d5ecb8b0a7c4b4b8b9b1a1',
          observations: null
        }
      },
      tooLong: {
        summary: 'Observaciones muy largas (genera error 422)',
        value: {
          code: 'EST005',
          firstName: 'Luis',
          lastName: 'Rodríguez',
          programId: '60d5ecb8b0a7c4b4b8b9b1a1',
          observations: 'A'.repeat(2001)
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Observaciones procesadas correctamente' })
  @ApiResponse({ status: 422, description: 'Error de validación en observaciones' })
  async testObservations(@Body() createStudentDto: CreateStudentDto) {
    return {
      message: 'Observaciones procesadas correctamente',
      data: {
        ...createStudentDto,
        sanitizedObservations: createStudentDto.observations
      }
    };
  }
}