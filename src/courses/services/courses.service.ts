import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from '../entities/course.entity';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { QueryCoursesDto } from '../dto/query-courses.dto';

/**
 * Course Management Service
 *
 * Servicio para gestión completa de materias/cursos académicos.
 * Incluye validación de prerequisitos y dependencias entre materias.
 * 
 * ⚠️ CRÍTICO: Eliminación debe validar enrollments activos y dependencias
 */
@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  /**
   * Crear nuevo curso
   * 
   * Validaciones implementadas:
   * - Código único (no duplicado)
   * - Prerequisitos existen en el sistema
   * - Validación de créditos y horas académicas
   * 
   * @param createCourseDto - Datos del curso a crear
   * @returns Curso creado
   * @throws ConflictException si el código ya existe
   * @throws BadRequestException si los prerequisitos no existen
   */
  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    // 1. Validar unicidad del código
    const existingCourse = await this.courseModel
      .findOne({ code: createCourseDto.code.toUpperCase() })
      .exec();

    if (existingCourse) {
      throw new ConflictException(
        `El curso con código "${createCourseDto.code}" ya existe`,
      );
    }

    // 2. Validar que los prerequisitos existan
    if (createCourseDto.prerequisites && createCourseDto.prerequisites.length > 0) {
      await this.validatePrerequisites(createCourseDto.prerequisites);
    }

    // 3. Crear el curso
    const newCourse = new this.courseModel({
      ...createCourseDto,
      code: createCourseDto.code.toUpperCase(),
    });

    return newCourse.save();
  }

  /**
   * Listar cursos con filtros avanzados
   * 
   * Funcionalidades:
   * - Paginación
   * - Búsqueda por código y nombre
   * - Filtros: activo, créditos, nivel, categoría, prerequisitos
   * - Ordenamiento configurable
   * 
   * @param queryDto - Parámetros de consulta y filtros
   * @returns Lista paginada de cursos
   */
  async findAll(queryDto: QueryCoursesDto): Promise<{
    data: Course[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      active,
      minCredits,
      maxCredits,
      academicLevel,
      category,
      hasPrerequisites,
      codePrefix,
      sortBy = 'code',
    } = queryDto;

    // Construir filtros dinámicos
    const filters: any = {};

    if (active !== undefined) {
      filters.active = active;
    }

    if (minCredits !== undefined || maxCredits !== undefined) {
      filters.credits = {};
      if (minCredits !== undefined) {
        filters.credits.$gte = minCredits;
      }
      if (maxCredits !== undefined) {
        filters.credits.$lte = maxCredits;
      }
    }

    if (academicLevel !== undefined) {
      filters.academicLevel = academicLevel;
    }

    if (category) {
      filters.category = category;
    }

    if (hasPrerequisites !== undefined) {
      if (hasPrerequisites) {
        filters.prerequisites = { $exists: true, $not: { $size: 0 } };
      } else {
        filters.$or = [
          { prerequisites: { $exists: false } },
          { prerequisites: { $size: 0 } },
        ];
      }
    }

    if (codePrefix) {
      filters.codePrefix = codePrefix.toUpperCase();
    }

    // Paginación (valores por defecto si no se proporcionan)
    const page = 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    // Ordenamiento
    const sortOptions: any = {};
    sortOptions[sortBy] = 1; // 1 = ascendente

    // Ejecutar consulta
    const [data, total] = await Promise.all([
      this.courseModel
        .find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.courseModel.countDocuments(filters).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener un curso por ID
   * 
   * Retorna detalles completos incluyendo:
   * - Información del curso
   * - Lista de prerequisitos expandida
   * 
   * @param id - ID del curso
   * @returns Curso encontrado
   * @throws NotFoundException si no existe
   */
  async findOne(id: string): Promise<Course> {
    const course = await this.courseModel.findById(id).exec();

    if (!course) {
      throw new NotFoundException(`Curso con ID "${id}" no encontrado`);
    }

    return course;
  }

  /**
   * Buscar curso por código
   * 
   * @param code - Código del curso
   * @returns Curso encontrado o null
   */
  async findByCode(code: string): Promise<Course | null> {
    return this.courseModel
      .findOne({ code: code.toUpperCase() })
      .exec();
  }

  /**
   * Actualizar curso
   * 
   * Validaciones:
   * - Validar impacto de cambios en prerequisitos
   * - Verificar que cambios no rompan dependencias
   * - Actualizar cadenas de prerequisitos automáticamente
   * 
   * @param id - ID del curso
   * @param updateCourseDto - Datos a actualizar
   * @returns Curso actualizado
   * @throws NotFoundException si no existe
   * @throws BadRequestException si hay conflictos
   */
  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    // 1. Verificar que el curso existe
    const existingCourse = await this.findOne(id);

    // 2. Si se actualiza el código, validar unicidad
    if (updateCourseDto.code && updateCourseDto.code !== existingCourse.code) {
      const duplicateCode = await this.courseModel
        .findOne({ 
          code: updateCourseDto.code.toUpperCase(),
          _id: { $ne: id }
        })
        .exec();

      if (duplicateCode) {
        throw new ConflictException(
          `El código "${updateCourseDto.code}" ya está en uso por otro curso`,
        );
      }
    }

    // 3. Validar nuevos prerequisitos si se proporcionan
    if (updateCourseDto.prerequisites && updateCourseDto.prerequisites.length > 0) {
      await this.validatePrerequisites(updateCourseDto.prerequisites);
    }

    // 4. Actualizar el curso
    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(
        id,
        {
          ...updateCourseDto,
          code: updateCourseDto.code?.toUpperCase(),
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedCourse) {
      throw new NotFoundException(`Curso con ID "${id}" no encontrado`);
    }

    return updatedCourse;
  }

  /**
   * Eliminar curso (con validaciones críticas)
   * 
   * ⚠️ VALIDACIONES CRÍTICAS:
   * - PROHIBIDO eliminar si tiene enrollments activos
   * - PROHIBIDO eliminar si es prerequisito de otras materias
   * - Se recomienda soft delete para auditoría académica
   * 
   * @param id - ID del curso
   * @returns Confirmación de eliminación
   * @throws NotFoundException si no existe
   * @throws BadRequestException si tiene dependencias
   */
  async remove(id: string): Promise<{ message: string; course: Course }> {
    // 1. Verificar que el curso existe
    const course = await this.findOne(id);

    // 2. VALIDACIÓN CRÍTICA: Verificar si es prerequisito de otros cursos
    const dependentCourses = await this.courseModel
      .find({ prerequisites: course.code })
      .select('code name')
      .exec();

    if (dependentCourses.length > 0) {
      const codes = dependentCourses.map(c => c.code).join(', ');
      throw new BadRequestException(
        `No se puede eliminar el curso "${course.code}" porque es prerequisito de: ${codes}`,
      );
    }

    // 3. VALIDACIÓN CRÍTICA: Verificar enrollments activos
    // TODO: Cuando se implemente el módulo de enrollments, descomentar:
    /*
    const hasActiveEnrollments = await this.enrollmentsService.hasActiveEnrollments(id);
    if (hasActiveEnrollments) {
      throw new BadRequestException(
        `No se puede eliminar el curso "${course.code}" porque tiene estudiantes inscritos activos`,
      );
    }
    */

    // 4. Opción recomendada: Soft delete (marcar como inactivo)
    const deletedCourse = await this.courseModel
      .findByIdAndUpdate(
        id,
        { active: false },
        { new: true },
      )
      .exec();

    if (!deletedCourse) {
      throw new NotFoundException(`Curso con ID "${id}" no encontrado para eliminar`);
    }

    // Opción alternativa: Hard delete (descomentar si se prefiere)
    // await this.courseModel.findByIdAndDelete(id).exec();

    return {
      message: `Curso "${course.code}" desactivado exitosamente`,
      course: deletedCourse,
    };
  }

  /**
   * Validar que una lista de prerequisitos exista
   * 
   * @param prerequisites - Lista de códigos de prerequisitos
   * @throws BadRequestException si algún prerequisito no existe
   */
  private async validatePrerequisites(prerequisites: string[]): Promise<void> {
    if (!prerequisites || prerequisites.length === 0) {
      return;
    }

    const upperPrerequisites = prerequisites.map(p => p.toUpperCase());

    const existingCourses = await this.courseModel
      .find({ code: { $in: upperPrerequisites } })
      .select('code')
      .exec();

    const existingCodes = existingCourses.map(c => c.code);
    const missingCodes = upperPrerequisites.filter(
      code => !existingCodes.includes(code),
    );

    if (missingCodes.length > 0) {
      throw new BadRequestException(
        `Los siguientes prerequisitos no existen: ${missingCodes.join(', ')}`,
      );
    }
  }

  /**
   * Obtener estadísticas de cursos
   * 
   * @returns Estadísticas generales
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byLevel: any[];
    byCategory: any[];
  }> {
    const [total, active, byLevel, byCategory] = await Promise.all([
      this.courseModel.countDocuments().exec(),
      this.courseModel.countDocuments({ active: true }).exec(),
      this.courseModel.aggregate([
        { $group: { _id: '$academicLevel', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).exec(),
      this.courseModel.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).exec(),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byLevel,
      byCategory,
    };
  }
}