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
import { CoursesService } from './services/courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCoursesDto } from './dto/query-courses.dto';

/**
 * Courses Controller
 * 
 * Gestión completa de materias/cursos académicos.
 * Incluye operaciones CRUD y consultas avanzadas con filtros.
 * 
 * @tag Courses
 */
@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * Crear nuevo curso
   * 
   * Endpoint para registrar una nueva materia en el catálogo académico.
   * Valida unicidad del código y existencia de prerequisitos.
   * 
   * @route POST /courses
   * @access Admin, Decanatura
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nuevo curso',
    description: `
      Registra una nueva materia/curso en el sistema académico.
      
      **Validaciones aplicadas:**
      - Código único (no duplicado)
      - Prerequisitos deben existir en el sistema
      - Créditos entre 1-10
      - Nivel académico entre 1-8
      
      **Reglas de negocio:**
      - El código se convierte automáticamente a mayúsculas
      - Se extrae el prefijo del código automáticamente
      - Los prerequisitos se validan contra cursos existentes
    `,
  })
  @ApiBody({
    type: CreateCourseDto,
    description: 'Datos del curso a crear',
    examples: {
      basicCourse: {
        summary: 'Curso básico sin prerequisitos',
        value: {
          code: 'CS101',
          name: 'Introduction to Computer Science',
          credits: 3,
          academicLevel: 1,
          category: 'Core',
          active: true,
          description: 'Fundamental concepts of computer science',
        },
      },
      advancedCourse: {
        summary: 'Curso avanzado con prerequisitos',
        value: {
          code: 'CS301',
          name: 'Data Structures and Algorithms',
          credits: 4,
          academicLevel: 3,
          category: 'Core',
          prerequisites: ['CS101', 'CS201'],
          active: true,
          description: 'Advanced data structures and algorithm design',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Curso creado exitosamente',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        academicLevel: 1,
        category: 'Core',
        prerequisites: [],
        active: true,
        codePrefix: 'CS',
        createdAt: '2025-10-09T10:30:00.000Z',
        updatedAt: '2025-10-09T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o prerequisitos no existen',
    schema: {
      example: {
        statusCode: 400,
        message: 'Los siguientes prerequisitos no existen: CS999',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El código del curso ya existe',
    schema: {
      example: {
        statusCode: 409,
        message: 'El curso con código "CS101" ya existe',
        error: 'Conflict',
      },
    },
  })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  /**
   * Listar todos los cursos con filtros
   * 
   * Endpoint para consultar cursos con paginación y filtros avanzados.
   * 
   * @route GET /courses
   * @access Public, Student, Decanatura, Admin
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar cursos con filtros',
    description: `
      Obtiene una lista paginada de cursos con filtros opcionales.
      
      **Filtros disponibles:**
      - Estado activo/inactivo
      - Rango de créditos (mínimo y máximo)
      - Nivel académico
      - Categoría del curso
      - Presencia de prerequisitos
      - Prefijo del código
      
      **Ordenamiento:**
      - Por código, nombre, créditos, nivel académico, o fecha
      
      **Paginación:**
      - Página por defecto: 1
      - Límite por defecto: 50 cursos
    `,
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo',
    example: true,
  })
  @ApiQuery({
    name: 'minCredits',
    required: false,
    type: Number,
    description: 'Créditos mínimos',
    example: 2,
  })
  @ApiQuery({
    name: 'maxCredits',
    required: false,
    type: Number,
    description: 'Créditos máximos',
    example: 4,
  })
  @ApiQuery({
    name: 'academicLevel',
    required: false,
    type: Number,
    description: 'Nivel académico (1-8)',
    example: 1,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['Core', 'Elective', 'Laboratory', 'Seminar', 'Workshop', 'Thesis'],
    description: 'Categoría del curso',
  })
  @ApiQuery({
    name: 'hasPrerequisites',
    required: false,
    type: Boolean,
    description: 'Filtrar cursos con/sin prerequisitos',
  })
  @ApiQuery({
    name: 'codePrefix',
    required: false,
    type: String,
    description: 'Prefijo del código (ej: CS, MATH)',
    example: 'CS',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['code', 'name', 'credits', 'academicLevel', 'createdAt', 'updatedAt'],
    description: 'Campo de ordenamiento',
    example: 'code',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            credits: 3,
            academicLevel: 1,
            category: 'Core',
            prerequisites: [],
            active: true,
            codePrefix: 'CS',
            createdAt: '2025-10-09T10:30:00.000Z',
            updatedAt: '2025-10-09T10:30:00.000Z',
          },
        ],
        total: 45,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
  })
  findAll(@Query() query: QueryCoursesDto) {
    return this.coursesService.findAll(query);
  }

  /**
   * Obtener estadísticas de cursos
   * 
   * @route GET /courses/statistics
   * @access Admin, Decanatura
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas de cursos',
    description: `
      Obtiene estadísticas generales sobre los cursos del sistema.
      
      **Incluye:**
      - Total de cursos
      - Cursos activos e inactivos
      - Distribución por nivel académico
      - Distribución por categoría
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total: 120,
        active: 115,
        inactive: 5,
        byLevel: [
          { _id: 1, count: 30 },
          { _id: 2, count: 28 },
          { _id: 3, count: 25 },
          { _id: 4, count: 20 },
        ],
        byCategory: [
          { _id: 'Core', count: 60 },
          { _id: 'Elective', count: 40 },
          { _id: 'Laboratory', count: 15 },
          { _id: 'Seminar', count: 5 },
        ],
      },
    },
  })
  getStatistics() {
    return this.coursesService.getStatistics();
  }

  /**
   * Obtener un curso por ID
   * 
   * @route GET /courses/:id
   * @access Public, Student, Decanatura, Admin
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener curso por ID',
    description: `
      Obtiene los detalles completos de un curso específico.
      
      **Incluye:**
      - Información completa del curso
      - Lista de prerequisitos
      - Metadata de creación y actualización
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso encontrado exitosamente',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        academicLevel: 1,
        category: 'Core',
        prerequisites: [],
        active: true,
        description: 'Fundamental concepts of computer science',
        codePrefix: 'CS',
        createdAt: '2025-10-09T10:30:00.000Z',
        updatedAt: '2025-10-09T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Curso con ID "507f1f77bcf86cd799439011" no encontrado',
        error: 'Not Found',
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  /**
   * Actualizar curso
   * 
   * @route PATCH /courses/:id
   * @access Admin, Decanatura
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar curso',
    description: `
      Actualiza la información de un curso existente.
      
      **Validaciones aplicadas:**
      - Si se cambia el código, verifica que no exista duplicado
      - Si se modifican prerequisitos, valida que existan
      - Todos los campos son opcionales
      
      **Nota:** Los cambios en prerequisitos pueden afectar otros cursos
      que dependen de este curso.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso a actualizar',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateCourseDto,
    description: 'Campos a actualizar (todos opcionales)',
    examples: {
      updateName: {
        summary: 'Actualizar solo el nombre',
        value: {
          name: 'Advanced Computer Science',
        },
      },
      updateMultiple: {
        summary: 'Actualizar varios campos',
        value: {
          credits: 4,
          description: 'Updated course description',
          prerequisites: ['CS100'],
        },
      },
      deactivate: {
        summary: 'Desactivar curso',
        value: {
          active: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Curso actualizado exitosamente',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        code: 'CS101',
        name: 'Advanced Computer Science',
        credits: 4,
        academicLevel: 1,
        category: 'Core',
        prerequisites: ['CS100'],
        active: true,
        codePrefix: 'CS',
        createdAt: '2025-10-09T10:30:00.000Z',
        updatedAt: '2025-10-09T15:45:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o prerequisitos no existen',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto al actualizar (código duplicado)',
  })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  /**
   * Eliminar curso (con validaciones críticas)
   * 
   * @route DELETE /courses/:id
   * @access Admin
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar/Desactivar curso',
    description: `
      Desactiva un curso del sistema (soft delete).
      
      ⚠️ **VALIDACIONES CRÍTICAS:**
      - NO se puede eliminar si es prerequisito de otros cursos
      - NO se puede eliminar si tiene estudiantes inscritos activos
      
      **Comportamiento:**
      - Por defecto, el curso se marca como "active: false" (soft delete)
      - El curso permanece en la base de datos para auditoría
      - Si se necesita eliminación física, contactar con soporte
      
      **Reglas de negocio (según US-0051):**
      - Impedir eliminar materia con grupos activos
      - Mantener integridad referencial del sistema
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso a eliminar',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso desactivado exitosamente',
    schema: {
      example: {
        message: 'Curso "CS101" desactivado exitosamente',
        course: {
          _id: '507f1f77bcf86cd799439011',
          code: 'CS101',
          name: 'Introduction to Computer Science',
          active: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar el curso por dependencias',
    schema: {
      example: {
        statusCode: 400,
        message: 'No se puede eliminar el curso "CS101" porque es prerequisito de: CS201, CS301',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado',
  })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}