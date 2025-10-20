import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RadicadoService } from '../services/radicado.service';

/**
 * RadicadoExamplesController - Ejemplos de generación de radicados
 */
@ApiTags('Radicado Examples')
@Controller('radicado-examples')
export class RadicadoExamplesController {
  constructor(private readonly radicadoService: RadicadoService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generar nuevo radicado',
    description: 'Genera un nuevo radicado único secuencial para el año actual.',
  })
  @ApiResponse({
    status: 201,
    description: 'Radicado generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        radicado: { type: 'string', example: '2024-000001' },
        year: { type: 'number', example: 2024 },
        sequence: { type: 'number', example: 1 },
      },
    },
  })
  async generateRadicado() {
    const radicado = await this.radicadoService.generateRadicado();
    const [year, sequence] = radicado.split('-');
    
    return {
      radicado,
      year: parseInt(year),
      sequence: parseInt(sequence),
    };
  }

  @Get('last/:year?')
  @ApiOperation({
    summary: 'Obtener último radicado',
    description: 'Obtiene el último radicado generado para un año específico o el actual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Último radicado obtenido',
    schema: {
      type: 'object',
      properties: {
        radicado: { type: 'string', example: '2024-000005' },
        year: { type: 'number', example: 2024 },
      },
    },
  })
  async getLastRadicado(@Param('year') year?: string) {
    const targetYear = year ? parseInt(year) : undefined;
    const radicado = await this.radicadoService.getLastRadicado(targetYear);
    
    if (!radicado) {
      return {
        radicado: null,
        year: targetYear || new Date().getFullYear(),
        message: 'No hay radicados generados para este año',
      };
    }

    const [radicadoYear] = radicado.split('-');
    return {
      radicado,
      year: parseInt(radicadoYear),
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Estadísticas de radicados',
    description: 'Obtiene estadísticas de radicados generados por año.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          year: { type: 'number', example: 2024 },
          count: { type: 'number', example: 15 },
        },
      },
    },
  })
  async getRadicadoStats() {
    return this.radicadoService.getRadicadoStats();
  }

  @Post('bulk/:count')
  @ApiOperation({
    summary: 'Generar múltiples radicados (prueba de concurrencia)',
    description: 'Genera múltiples radicados para probar la unicidad en concurrencia.',
  })
  async generateBulkRadicados(@Param('count') count: string) {
    const numCount = Math.min(parseInt(count), 100); // Límite de seguridad
    
    const promises = Array.from({ length: numCount }, () =>
      this.radicadoService.generateRadicado()
    );

    const radicados = await Promise.all(promises);
    
    return {
      count: radicados.length,
      radicados,
      unique: new Set(radicados).size === radicados.length,
    };
  }
}