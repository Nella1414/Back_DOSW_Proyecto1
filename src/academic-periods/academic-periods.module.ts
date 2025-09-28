import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicPeriod, AcademicPeriodSchema } from './entities/academic-period.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AcademicPeriod.name, schema: AcademicPeriodSchema }
    ])
  ],
  exports: [MongooseModule]
})
export class AcademicPeriodsModule {}