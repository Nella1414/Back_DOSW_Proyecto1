import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicPeriod, AcademicPeriodSchema } from './entities/academic-period.entity';
import { AcademicPeriodsService } from './services/academic-periods.service';
import { AcademicPeriodsController } from './academic-periods.controller';

/**
 * Academic Periods Module
 *
 * Provides complete academic period management functionality including:
 * - Entity and database schema definitions
 * - Service layer for business logic
 * - REST API controller endpoints
 * - Exports for use in other modules
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AcademicPeriod.name, schema: AcademicPeriodSchema }
    ])
  ],
  controllers: [AcademicPeriodsController],
  providers: [AcademicPeriodsService],
  exports: [MongooseModule, AcademicPeriodsService]
})
export class AcademicPeriodsModule {}