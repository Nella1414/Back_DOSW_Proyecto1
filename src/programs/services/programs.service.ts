import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { Program, ProgramDocument } from '../entities/program.entity';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectModel(Program.name)
    private programModel: Model<ProgramDocument>,
  ) {}

  create(createProgramDto: CreateProgramDto) {
    return this.programModel.create(createProgramDto);
  }

  findAll() {
    return this.programModel.find({ isActive: true }).exec();
  }

  /**
   * ! Funcion sin implementar - Retorna string placeholder
   * ? Debe retornar programa con curricula completa
   * ? Incluir estudiantes activos y estadisticas
   * TODO: Implementar busqueda por ID con validacion
   * TODO: Incluir malla curricular completa
   * TODO: Mostrar estudiantes activos por semestre
   * TODO: Agregar estadisticas historicas del programa
   */
  findOne(id: number) {
    return `This action returns a #${id} program`;
  }

  /**
   * ! Funcion sin implementar - Retorna string placeholder
   * ? Debe actualizar programa con validacion de impacto
   * ? Cambios en creditos/semestres afectan estudiantes actuales
   * TODO: Validar impacto de cambios en estudiantes activos
   * TODO: Implementar versionado de curricula
   * TODO: Notificar cambios a estudiantes afectados
   * TODO: Mantener compatibilidad con versiones anteriores
   */
  update(id: number, updateProgramDto: UpdateProgramDto) {
    return `This action updates a #${id} program`;
  }

  /**
   * ! Funcion sin implementar - Retorna string placeholder
   * ? Debe eliminar programa con verificaciones criticas
   * ? PROHIBIDO eliminar si tiene estudiantes inscritos activos
   * ? PROHIBIDO eliminar si tiene materias asociadas
   * TODO: Verificar que no tenga estudiantes activos
   * TODO: Validar que no tenga materias asociadas
   * TODO: Ofrecer transferencia de estudiantes a programas similares
   * TODO: Implementar soft delete para auditoria academica
   */
  remove(id: number) {
    return `This action removes a #${id} program`;
  }
}
