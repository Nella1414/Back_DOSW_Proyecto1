import { Module } from '@nestjs/common';
import { AcademicTrafficLightService } from './services/academic-traffic-light.service';
import { AcademicTrafficLightController } from './academic-traffic-light.controller';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [SchedulesModule],
  controllers: [AcademicTrafficLightController],
  providers: [AcademicTrafficLightService],
  exports: [AcademicTrafficLightService],
})
export class AcademicTrafficLightModule {}
