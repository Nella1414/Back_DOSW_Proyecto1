import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsService } from './services/students.service';
import { StudentsController } from './students.controller';
import { Student, StudentSchema } from './entities/student.entity';
import { SchedulesModule } from '../schedules/schedules.module';

/**
 * Students Module
 *
 * Comprehensive student management module that provides complete functionality
 * for student lifecycle management in the academic system.
 *
 * Features:
 * - Student registration and profile management
 * - Academic program association and tracking
 * - Schedule management integration
 * - Academic history and performance tracking
 * - Authentication and authorization integration
 *
 * Dependencies:
 * - MongoDB/Mongoose for data persistence
 * - SchedulesModule for academic schedule functionality
 * - Authentication system for secure access
 *
 * ! IMPORTANTE: Este módulo es el núcleo de la gestión estudiantil
 * ! y debe mantener la integridad de los datos académicos
 */
@Module({
  imports: [
    // TODO: Configurar esquema de estudiante con validaciones apropiadas
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema }
    ]),
    // * Integración con módulo de horarios para funcionalidad académica
    SchedulesModule
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [MongooseModule, StudentsService],
})
export class StudentsModule {}
