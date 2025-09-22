import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestEventDto } from './create-request-event.dto';

export class UpdateRequestEventDto extends PartialType(CreateRequestEventDto) {}
