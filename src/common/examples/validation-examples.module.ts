import { Module } from '@nestjs/common';
import { ValidationExamplesController } from './validation-examples.controller';

/**
 * ValidationExamplesModule - Módulo para ejemplos de validación
 * 
 * Proporciona endpoints de ejemplo que demuestran las validaciones
 * implementadas y las respuestas 422 con detalles por campo.
 */
@Module({
  controllers: [ValidationExamplesController],
})
export class ValidationExamplesModule {}