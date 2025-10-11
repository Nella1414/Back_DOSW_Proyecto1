import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentsService } from './services/enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { Enrollment, EnrollmentSchema } from './entities/enrollment.entity';
import { Student, StudentSchema } from '../students/entities/student.entity';
import {
  CourseGroup,
  CourseGroupSchema,
} from '../course-groups/entities/course-group.entity';

/**
 * Enrollments Module
 * 
 * Módulo completo para gestión de inscripciones académicas.
 * 
 * **Funcionalidades:**
 * - CRUD completo de inscripciones
 * - Validación de cupos y duplicados
 * - Calificación de estudiantes
 * - Cancelación con motivos
 * - Estadísticas y reportes
 * 
 * **Exports:**
 * - MongooseModule: Para usar Enrollment en otros módulos
 * - EnrollmentsService: Para inyección de dependencias
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Student.name, schema: StudentSchema },
      { name: CourseGroup.name, schema: CourseGroupSchema },
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [
    MongooseModule, // Permite usar Enrollment en otros módulos
    EnrollmentsService, // Permite inyectar EnrollmentsService en otros módulos
  ],
})
export class EnrollmentsModule {}