import { PartialType } from '@nestjs/mapped-types';
import { CreateProgramAcceDto } from './create-program-acce.dto';

export class UpdateProgramAcceDto extends PartialType(CreateProgramAcceDto) {}
