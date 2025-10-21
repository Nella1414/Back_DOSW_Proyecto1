import { PartialType } from '@nestjs/mapped-types';
import { CreateChangeWindowDto } from './create-change-window.dto';

export class UpdateChangeWindowDto extends PartialType(CreateChangeWindowDto) {}
