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
import { WaitlistsService } from './services/waitlists.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { QueryWaitlistDto } from './dto/query-waitlist.dto'; 

/**
 * Waitlists Controller
 * 
 * Gestión completa de listas de espera para grupos llenos.
 * Permite agregar, consultar, admitir y gestionar listas de espera.
 * 
 * @tag Waitlists
 */
@ApiTags('Waitlists')
@ApiBearerAuth()
@Controller('waitlists')
export class WaitlistsController {
  constructor(private readonly waitlistsService: WaitlistsService) {}

  /**
   * Agregar estudiante a lista de espera
   * 
   * @route POST /waitlists
   * @access Admin, Decanatura, Student
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar estudiante a lista de espera',
    description: `
      Registra un estudiante en la lista de espera de un grupo lleno.
      
      **Validaciones aplicadas:**
      - El estudiante debe existir
      - El grupo debe existir y estar lleno
      - No puede haber entrada duplicada activa
      - Calcula posición automáticamente por prioridad y orden de llegada
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Estudiante agregado a la lista de espera exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'El grupo aún tiene cupos disponibles',
  })
  @ApiResponse({
    status: 404,
    description: 'Estudiante o grupo no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El estudiante ya está en la lista de espera',
  })
  create(@Body() createWaitlistDto: CreateWaitlistDto) {
    return this.waitlistsService.create(createWaitlistDto);
  }

  /**
   * Listar listas de espera con filtros
   * 
   * @route GET /waitlists
   * @access Admin, Decanatura
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar listas de espera con filtros',
    description: `
      Obtiene una lista paginada de entradas en listas de espera.
      
      **Filtros disponibles:**
      - Por grupo, estudiante, o periodo académico
      - Por estado de waitlist
      - Por prioridad mínima
      
      **Ordenamiento:**
      - Por posición (default)
      - Por prioridad
      - Por fecha de creación
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de espera obtenida exitosamente',
  })
  findAll(@Query() query: QueryWaitlistDto) {
    return this.waitlistsService.findAll(query);
  }

  /**
   * Obtener estadísticas de listas de espera
   * 
   * @route GET /waitlists/statistics
   * @access Admin, Decanatura
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas de listas de espera',
    description: `
      Obtiene estadísticas generales de listas de espera.
      
      **Incluye:**
      - Total de entradas
      - Distribución por estado
      - Tiempo promedio de espera
      - Distribución por prioridad
    `,
  })
  @ApiQuery({
    name: 'groupId',
    required: false,
    description: 'Filtrar por grupo específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  getStatistics(@Query('groupId') groupId?: string) {
    return this.waitlistsService.getStatistics(groupId);
  }

  /**
   * Obtener lista de espera por grupo
   * 
   * @route GET /waitlists/group/:groupId
   * @access Admin, Decanatura, Professor
   */
  @Get('group/:groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener lista de espera de un grupo',
    description: 'Lista todos los estudiantes en espera para un grupo específico, ordenados por prioridad y posición.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID del grupo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de espera del grupo',
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo no encontrado',
  })
  findByGroup(@Param('groupId') groupId: string) {
    return this.waitlistsService.findByGroup(groupId);
  }

  /**
   * Obtener listas de espera de un estudiante
   * 
   * @route GET /waitlists/student/:studentId
   * @access Admin, Decanatura, Student (propio)
   */
  @Get('student/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener listas de espera de un estudiante',
    description: 'Lista todas las listas de espera en las que está registrado un estudiante.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'ID del estudiante',
  })
  @ApiResponse({
    status: 200,
    description: 'Listas de espera del estudiante',
  })
  @ApiResponse({
    status: 404,
    description: 'Estudiante no encontrado',
  })
  findByStudent(@Param('studentId') studentId: string) {
    return this.waitlistsService.findByStudent(studentId);
  }

  /**
   * Admitir siguiente estudiante
   * 
   * @route POST /waitlists/group/:groupId/admit-next
   * @access Admin, Decanatura
   */
  @Post('group/:groupId/admit-next')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admitir siguiente estudiante en la lista',
    description: `
      Admite al siguiente estudiante en la lista de espera.
      
      **Proceso:**
      - Busca el primer estudiante en espera (mayor prioridad, menor posición)
      - Cambia su estado a ADMITTED
      - Establece deadline de respuesta (48 horas)
    `,
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID del grupo',
  })
  @ApiResponse({
    status: 200,
    description: 'Estudiante admitido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'No hay estudiantes en espera',
  })
  admitNext(@Param('groupId') groupId: string) {
    return this.waitlistsService.admitNext(groupId);
  }

  /**
   * Procesar lista de espera automáticamente
   * 
   * @route POST /waitlists/group/:groupId/process
   * @access Admin
   */
  @Post('group/:groupId/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar lista de espera automáticamente',
    description: `
      Procesa automáticamente la lista de espera del grupo.
      
      **Proceso:**
      - Verifica cupos disponibles
      - Admite estudiantes según disponibilidad
      - Respeta orden de prioridad y posición
    `,
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID del grupo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista procesada exitosamente',
    schema: {
      example: {
        admitted: 3,
        students: [],
      },
    },
  })
  processWaitlist(@Param('groupId') groupId: string) {
    return this.waitlistsService.processWaitlist(groupId);
  }

  /**
   * Expirar deadlines vencidos
   * 
   * @route POST /waitlists/expire-deadlines
   * @access System, Admin
   */
  @Post('expire-deadlines')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Expirar entradas con deadline vencido',
    description: `
      Busca y expira automáticamente las entradas admitidas 
      que no han recibido respuesta antes del deadline.
      
      **Uso:** Este endpoint debe ejecutarse periódicamente mediante un CRON job.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Deadlines procesados exitosamente',
    schema: {
      example: {
        expired: 5,
      },
    },
  })
  async expireDeadlines() {
    const expired = await this.waitlistsService.expireDeadlines();
    return { expired };
  }

  /**
   * Obtener entrada de waitlist por ID
   * 
   * @route GET /waitlists/:id
   * @access Admin, Decanatura, Student (propio)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener entrada de waitlist por ID',
    description: 'Obtiene los detalles completos de una entrada en lista de espera.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la entrada de waitlist',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrada encontrada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Entrada no encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.waitlistsService.findOne(id);
  }

  /**
   * Actualizar entrada de waitlist
   * 
   * @route PATCH /waitlists/:id
   * @access Admin, Decanatura
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar entrada de waitlist',
    description: `
      Actualiza información de una entrada en lista de espera.
      
      **Validaciones:**
      - Transiciones de estado permitidas
      - Si cambia a WITHDRAWN/EXPIRED, reordena posiciones
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la entrada',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrada actualizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado inválida',
  })
  @ApiResponse({
    status: 404,
    description: 'Entrada no encontrada',
  })
  update(
    @Param('id') id: string,
    @Body() updateWaitlistDto: UpdateWaitlistDto,
  ) {
    return this.waitlistsService.update(id, updateWaitlistDto);
  }

  /**
   * Eliminar entrada de waitlist
   * 
   * @route DELETE /waitlists/:id
   * @access Admin, Student (propio)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar entrada de lista de espera',
    description: `
      Elimina una entrada de la lista de espera (soft delete).
      
      **Proceso:**
      - Cambia el estado a WITHDRAWN
      - Reordena automáticamente las posiciones restantes
      - Notifica a los estudiantes afectados (pendiente)
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la entrada',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrada eliminada y posiciones reordenadas',
  })
  @ApiResponse({
    status: 404,
    description: 'Entrada no encontrada',
  })
  remove(@Param('id') id: string) {
    return this.waitlistsService.remove(id);
  }
}