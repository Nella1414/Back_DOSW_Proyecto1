import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { EnrollmentsService } from './services/enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';

/**
 * Enrollments Controller
 * 
 * Gestión completa de inscripciones académicas.
 * Permite inscribir estudiantes, calificar, cancelar y consultar inscripciones.
 * 
 * @tag Enrollments
 */
@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**
   * Crear nueva inscripción
   * 
   * @route POST /enrollments
   * @access Admin, Decanatura
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva inscripción',
    description: `
      Inscribe un estudiante en un grupo de curso.
      
      **Validaciones aplicadas:**
      - El estudiante debe existir
      - El grupo debe existir y tener cupo disponible
      - No puede haber inscripción duplicada activa
      - Si incluye calificación, debe ser para estados PASSED/FAILED
      - Estados CANCELLED/WITHDRAWN requieren motivo
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Inscripción creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o reglas de negocio violadas',
  })
  @ApiResponse({
    status: 404,
    description: 'Estudiante o grupo no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El estudiante ya está inscrito en este grupo',
  })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  /**
   * Inscribir estudiante (método simplificado)
   * 
   * @route POST /enrollments/enroll/:studentId/:groupId/:periodId
   * @access Admin, Decanatura
   */
  @Post('enroll/:studentId/:groupId/:periodId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscribir estudiante en grupo (método simplificado)',
    description: 'Inscribe un estudiante en un grupo con estado ENROLLED por defecto.',
  })
  @ApiParam({ name: 'studentId', description: 'ID del estudiante' })
  @ApiParam({ name: 'groupId', description: 'ID del grupo' })
  @ApiParam({ name: 'periodId', description: 'ID del periodo académico' })
  @ApiResponse({
    status: 201,
    description: 'Estudiante inscrito exitosamente',
  })
  enrollStudent(
    @Param('studentId') studentId: string,
    @Param('groupId') groupId: string,
    @Param('periodId') periodId: string,
  ) {
    return this.enrollmentsService.enrollStudentInCourse(studentId, groupId, periodId);
  }

  /**
   * Listar inscripciones con filtros
   * 
   * @route GET /enrollments
   * @access Admin, Decanatura, Professor
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar inscripciones con filtros',
    description: `
      Obtiene una lista paginada de inscripciones con filtros opcionales.
      
      **Filtros disponibles:**
      - Por estudiante, grupo, o periodo académico
      - Por estado de inscripción
      - Por rango de calificaciones
      - Por fechas de inscripción
      - Inscripciones especiales
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones obtenida exitosamente',
  })
  findAll(@Query() query: QueryEnrollmentsDto) {
    return this.enrollmentsService.findAll(query);
  }

  /**
   * Obtener estadísticas de inscripciones
   * 
   * @route GET /enrollments/statistics
   * @access Admin, Decanatura
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas de inscripciones',
    description: `
      Obtiene estadísticas generales de inscripciones.
      
      **Incluye:**
      - Total de inscripciones
      - Distribución por estado
      - Distribución por rangos de calificación
      - Inscripciones especiales
      - Promedio general de calificaciones
    `,
  })
  @ApiQuery({
    name: 'academicPeriodId',
    required: false,
    description: 'Filtrar por periodo académico',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  getStatistics(@Query('academicPeriodId') academicPeriodId?: string) {
    return this.enrollmentsService.getStatistics(academicPeriodId);
  }

  /**
   * Obtener inscripciones por estudiante
   * 
   * @route GET /enrollments/student/:studentId
   * @access Admin, Decanatura, Student (propio)
   */
  @Get('student/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener inscripciones de un estudiante',
    description: 'Lista todas las inscripciones de un estudiante específico.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'ID del estudiante',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones del estudiante',
  })
  @ApiResponse({
    status: 404,
    description: 'Estudiante no encontrado',
  })
  findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentsService.findByStudent(studentId);
  }

  /**
   * Obtener inscripciones por grupo
   * 
   * @route GET /enrollments/group/:groupId
   * @access Admin, Decanatura, Professor
   */
  @Get('group/:groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener inscripciones de un grupo',
    description: 'Lista todas las inscripciones de un grupo específico.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID del grupo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones del grupo',
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo no encontrado',
  })
  findByGroup(@Param('groupId') groupId: string) {
    return this.enrollmentsService.findByGroup(groupId);
  }

  /**
   * Obtener inscripción por ID
   * 
   * @route GET /enrollments/:id
   * @access Admin, Decanatura, Professor, Student (propio)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener inscripción por ID',
    description: 'Obtiene los detalles completos de una inscripción específica.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Inscripción encontrada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Inscripción no encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  /**
   * Actualizar inscripción
   * 
   * @route PATCH /enrollments/:id
   * @access Admin, Decanatura
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar inscripción',
    description: `
      Actualiza información de una inscripción existente.
      
      **Validaciones:**
      - Transiciones de estado permitidas
      - Calificación solo para estados PASSED/FAILED
      - Motivo requerido para CANCELLED/WITHDRAWN
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Inscripción actualizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado inválida o datos incorrectos',
  })
  @ApiResponse({
    status: 404,
    description: 'Inscripción no encontrada',
  })
  update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(id, updateEnrollmentDto);
  }

  /**
   * Calificar inscripción
   * 
   * @route PATCH /enrollments/:id/grade
   * @access Admin, Professor
   */
  @Patch(':id/grade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calificar inscripción',
    description: 'Asigna una calificación a una inscripción y actualiza su estado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        grade: {
          type: 'number',
          minimum: 0,
          maximum: 5,
          example: 4.5,
        },
        gradedBy: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
      },
      required: ['grade'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Calificación asignada exitosamente',
  })
  gradeEnrollment(
    @Param('id') id: string,
    @Body('grade') grade: number,
    @Body('gradedBy') gradedBy?: string,
  ) {
    return this.enrollmentsService.gradeEnrollment(id, grade, gradedBy);
  }

  /**
   * Cancelar inscripción
   * 
   * @route PATCH /enrollments/:id/cancel
   * @access Admin, Decanatura, Student (propio)
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar inscripción',
    description: 'Cambia el estado de la inscripción a CANCELLED.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          minLength: 10,
          maxLength: 500,
          example: 'Problemas de salud del estudiante',
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Inscripción cancelada exitosamente',
  })
  cancelEnrollment(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.enrollmentsService.cancelEnrollment(id, reason);
  }

  /**
   * Eliminar inscripción
   * 
   * @route DELETE /enrollments/:id
   * @access Admin
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar inscripción',
    description: `
      Elimina una inscripción del sistema (soft delete).
      
      **Restricciones:**
      - Solo se pueden eliminar inscripciones con estado ENROLLED
      - Se cambia el estado a CANCELLED automáticamente
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la inscripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Inscripción eliminada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar la inscripción en su estado actual',
  })
  @ApiResponse({
    status: 404,
    description: 'Inscripción no encontrada',
  })
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(id);
  }
}