import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupSchedualeDto } from './create-group-scheduale.dto';

export class UpdateGroupSchedualeDto extends PartialType(CreateGroupSchedualeDto) {}
