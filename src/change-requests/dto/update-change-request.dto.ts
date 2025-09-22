import { PartialType } from '@nestjs/mapped-types';
import { CreateChangeRequestDto } from './create-change-request.dto';

export class UpdateChangeRequestDto extends PartialType(CreateChangeRequestDto) {}
