import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicTrafficLightDto } from './create-academic-traffic-light.dto';

export class UpdateAcademicTrafficLightDto extends PartialType(CreateAcademicTrafficLightDto) {}
