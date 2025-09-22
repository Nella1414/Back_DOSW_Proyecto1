import { Module } from '@nestjs/common';
import { AcademicTrafficLightService } from './academic-traffic-light.service';
import { AcademicTrafficLightController } from './academic-traffic-light.controller';

@Module({
  controllers: [AcademicTrafficLightController],
  providers: [AcademicTrafficLightService],
})
export class AcademicTrafficLightModule {}
