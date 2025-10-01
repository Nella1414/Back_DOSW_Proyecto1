import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupScheduleDto } from './create-group-schedule.dto';

export class UpdateGroupScheduleDto extends PartialType(
  CreateGroupScheduleDto,
) {}
