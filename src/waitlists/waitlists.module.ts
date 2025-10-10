import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WaitlistsService } from './services/waitlists.service';
import { WaitlistsController } from './waitlists.controller';
import { GroupWaitlist, WaitlistSchema } from './entities/waitlist.entity';
import { Student, StudentSchema } from '../students/entities/student.entity';
import {
  CourseGroup,
  CourseGroupSchema,
} from '../course-groups/entities/course-group.entity';

/**
 * Waitlists Module
 * 
 * Módulo completo para gestión de listas de espera.
 * 
 * **Funcionalidades:**
 * - CRUD completo de listas de espera
 * - Cálculo automático de posiciones
 * - Gestión de prioridades
 * - Procesamiento automático de admisiones
 * - Expiración de deadlines
 * - Reordenamiento automático
 * 
 * **Exports:**
 * - MongooseModule: Para usar GroupWaitlist en otros módulos
 * - WaitlistsService: Para inyección de dependencias
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupWaitlist.name, schema: WaitlistSchema },
      { name: Student.name, schema: StudentSchema },
      { name: CourseGroup.name, schema: CourseGroupSchema },
    ]),
  ],
  controllers: [WaitlistsController],
  providers: [WaitlistsService],
  exports: [
    MongooseModule, // Permite usar GroupWaitlist en otros módulos
    WaitlistsService, // Permite inyectar WaitlistsService en otros módulos
  ],
})
export class WaitlistsModule {}