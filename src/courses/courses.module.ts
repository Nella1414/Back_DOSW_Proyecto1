import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesService } from './services/courses.service';
import { CoursesController } from './courses.controller';
import { Course, CourseSchema } from './entities/course.entity';

/**
 * Courses Module
 *
 * Comprehensive module for managing academic courses.
 *
 * **Features:**
 * - Full CRUD operations for courses
 * - Prerequisite validation
 * - Advanced filtering and search
 * - Protection against deletion when dependencies exist
 *
 * **Exports:**
 * - MongooseModule: Enables use of Course model in other modules
 * - CoursesService: Allows dependency injection of CoursesService in other modules
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: Course.name, 
        schema: CourseSchema 
      }
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [
    MongooseModule, // Enables use of Course model in other modules
    CoursesService  // Allows injection of CoursesService in other modules
  ],
})
export class CoursesModule {}