import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * ValidationExceptionFilter - Maneja errores de validación con formato detallado
 * 
 * Convierte errores de class-validator en respuestas 422 con información específica
 * por campo para que el frontend pueda mostrar errores precisos.
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const exceptionResponse = exception.getResponse() as any;

    // Verificar si es un error de validación
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      Array.isArray(exceptionResponse.message)
    ) {
      const validationErrors = this.formatValidationErrors(exceptionResponse.message);

      return response.status(422).json({
        statusCode: 422,
        error: 'Validation Failed',
        message: 'Los datos enviados contienen errores de validación',
        timestamp: new Date().toISOString(),
        path: request.url,
        errors: validationErrors,
      });
    }

    // Si no es error de validación, mantener comportamiento original
    return response.status(exception.getStatus()).json(exceptionResponse);
  }

  /**
   * Formatea errores de class-validator en estructura detallada
   */
  private formatValidationErrors(validationErrors: any[]): any[] {
    const errors = [];

    for (const error of validationErrors) {
      if (error.constraints) {
        // Error directo en campo
        for (const [constraintKey, message] of Object.entries(error.constraints)) {
          errors.push({
            field: error.property,
            message: message as string,
            value: error.value,
            constraint: constraintKey,
          });
        }
      }

      // Errores anidados (objetos dentro de objetos)
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatNestedErrors(error.children, error.property);
        errors.push(...nestedErrors);
      }
    }

    return errors;
  }

  /**
   * Maneja errores de validación en objetos anidados
   */
  private formatNestedErrors(children: any[], parentProperty: string): any[] {
    const errors = [];

    for (const child of children) {
      const fieldPath = `${parentProperty}.${child.property}`;

      if (child.constraints) {
        for (const [constraintKey, message] of Object.entries(child.constraints)) {
          errors.push({
            field: fieldPath,
            message: message as string,
            value: child.value,
            constraint: constraintKey,
          });
        }
      }

      if (child.children && child.children.length > 0) {
        const nestedErrors = this.formatNestedErrors(child.children, fieldPath);
        errors.push(...nestedErrors);
      }
    }

    return errors;
  }
}