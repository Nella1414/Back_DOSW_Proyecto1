import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProgramsService } from './services/programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { Public } from '../auth/decorators/auth.decorator';

/**
 * * Academic Programs Controller
 *
 * ! Controller sin implementar - Servicio retorna solo strings placeholder
 * ? Maneja programas academicos (carreras) asociados a facultades
 * TODO: Implementar validacion de permisos ADMIN/DEAN para creacion y modificacion
 * TODO: Agregar relacion con facultades y estudiantes
 */
@ApiTags('Academic Programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  /**
   * * Create academic program
   * ! Funcion sin implementar - Service retorna string placeholder
   * ? Debe validar codigo unico y asociacion con facultad valida
   * TODO: Validar creditos totales y semestres del programa
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new academic program',
    description: 'Creates a new academic program (career) associated with a faculty',
  })
  @ApiBody({ type: CreateProgramDto })
  @ApiResponse({
    status: 201,
    description: 'Academic program successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid program data' })
  @ApiResponse({ status: 409, description: 'Program code already exists' })
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  /**
   * * Get all academic programs - PUBLIC endpoint for registration
   * Returns all active academic programs
   * Used by registration form to populate program selection
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all academic programs',
    description: 'Retrieves a list of all academic programs in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of academic programs retrieved successfully',
  })
  findAll() {
    return this.programsService.findAll();
  }

  /**
   * * Get program by ID
   * ! Funcion sin implementar - Service retorna string placeholder
   * ? Debe incluir informacion de facultad y curricula
   * TODO: Mostrar estudiantes activos y estadisticas del programa
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get academic program by ID',
    description: 'Retrieves a specific academic program with faculty and curriculum information',
  })
  @ApiParam({ name: 'id', description: 'Academic program ID' })
  @ApiResponse({
    status: 200,
    description: 'Academic program found',
  })
  @ApiResponse({ status: 404, description: 'Academic program not found' })
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(+id);
  }

  /**
   * * Update academic program
   * ! Funcion sin implementar - Service retorna string placeholder
   * ? Cambios en creditos/semestres afectan estudiantes actuales
   * TODO: Validar impacto en estudiantes antes de cambios criticos
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update academic program',
    description: 'Updates an existing academic program. Changes may affect enrolled students',
  })
  @ApiParam({ name: 'id', description: 'Academic program ID' })
  @ApiBody({ type: UpdateProgramDto })
  @ApiResponse({
    status: 200,
    description: 'Academic program successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Academic program not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.update(+id, updateProgramDto);
  }

  /**
   * * Delete academic program
   * ! Funcion sin implementar - Service retorna string placeholder
   * ? CRITICO: No se puede eliminar programa con estudiantes activos
   * TODO: Implementar validacion de estudiantes antes de eliminacion
   * TODO: Ofrecer transferencia de estudiantes a otro programa
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete academic program',
    description: 'Removes an academic program. Cannot delete programs with active students',
  })
  @ApiParam({ name: 'id', description: 'Academic program ID' })
  @ApiResponse({
    status: 200,
    description: 'Academic program successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Academic program not found' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete program with active students',
  })
  remove(@Param('id') id: string) {
    return this.programsService.remove(+id);
  }
}
