import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateStudentDto } from '../../students/dto/create-student.dto';
import { CreateCourseDto } from '../../courses/dto/create-course.dto';
import { LoginAuthDto } from '../../auth/dto/login-auth.dto';

/**
 * ValidationExamplesController - Ejemplos de validaciones detalladas
 * 
 * Este controlador demuestra cómo las validaciones implementadas
 * generan respuestas 422 con información específica por campo.
 */
@ApiTags('Validation Examples')
@Controller('validation-examples')
export class ValidationExamplesController {

  /**
   * Ejemplo de validación de estudiante
   */
  @Post('student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejemplo de validación de estudiante',
    description: `Prueba las validaciones implementadas para estudiantes con respuestas 422 detalladas.`,
  })
  @ApiBody({
    type: CreateStudentDto,
    examples: {
      valid: {
        summary: 'Datos válidos',
        value: {
          code: 'EST001',
          firstName: 'Juan Carlos',
          lastName: 'Pérez García',
          programId: '60d5ecb8b0a7c4b4b8b9b1a1',
          email: 'juan.perez@universidad.edu',
          phone: '+57 300 123 4567',
          currentSemester: 3
        }
      },
      invalid: {
        summary: 'Datos inválidos (genera errores 422)',
        value: {
          code: 'abc',
          firstName: 'Juan123',
          lastName: '',
          programId: '123',
          email: 'correo-malo',
          phone: '123abc',
          currentSemester: 15
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Validación exitosa' })
  @ApiResponse({ status: 422, description: 'Error de validación con detalles por campo' })
  async validateStudent(@Body() createStudentDto: CreateStudentDto) {
    return {
      message: 'Datos de estudiante válidos',
      data: createStudentDto
    };
  }

  /**
   * Ejemplo de validación de curso
   */
  @Post('course')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejemplo de validación de curso',
    description: `Prueba las validaciones implementadas para cursos.`,
  })
  @ApiBody({
    type: CreateCourseDto,
    examples: {
      valid: {
        summary: 'Datos válidos',
        value: {
          code: 'CS101',
          name: 'Introducción a las Ciencias de la Computación',
          description: 'Curso introductorio que cubre los conceptos fundamentales de programación, algoritmos y estructuras de datos básicas.',
          credits: 3,
          prerequisites: ['MATH101'],
          isActive: true,
          academicLevel: 1,
          category: 'Núcleo',
          learningObjectives: [
            'Comprender los conceptos básicos de programación',
            'Aplicar técnicas de resolución de problemas'
          ]
        }
      },
      invalid: {
        summary: 'Datos inválidos (genera errores 422)',
        value: {
          code: 'CS',
          name: 'CS',
          description: 'Curso',
          credits: 15,
          prerequisites: ['ABC'],
          academicLevel: 10
        }
      }
    }
  })
  async validateCourse(@Body() createCourseDto: CreateCourseDto) {
    return {
      message: 'Datos de curso válidos',
      data: createCourseDto
    };
  }

  /**
   * Ejemplo de validación de login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejemplo de validación de login',
    description: `Prueba las validaciones implementadas para autenticación.`,
  })
  @ApiBody({
    type: LoginAuthDto,
    examples: {
      valid: {
        summary: 'Datos válidos',
        value: {
          email: 'usuario@ejemplo.com',
          password: 'MiContraseña123'
        }
      },
      invalid: {
        summary: 'Datos inválidos (genera errores 422)',
        value: {
          email: 'usuario',
          password: '123'
        }
      }
    }
  })
  async validateLogin(@Body() loginDto: LoginAuthDto) {
    return {
      message: 'Datos de login válidos',
      data: loginDto
    };
  }
}