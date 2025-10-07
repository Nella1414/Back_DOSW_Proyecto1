import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProgramsService } from './services/programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

/**
 * * Academic Programs Controller
 *
 * ! Controller sin implementar - Servicio retorna solo strings placeholder
 * ? Maneja programas academicos (carreras) asociados a facultades
 * TODO: Implementar Swagger documentation completa
 * TODO: Validar permisos ADMIN/DEAN para creacion y modificacion
 * TODO: Agregar relacion con facultades y estudiantes
 */
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
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  /**
   * * Get all academic programs
   * ! Funcion sin implementar - Service retorna string placeholder
   * ? Deberia incluir paginacion y filtros por facultad
   * TODO: Incluir estadisticas de estudiantes inscritos
   */
  @Get()
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
  remove(@Param('id') id: string) {
    return this.programsService.remove(+id);
  }
}
