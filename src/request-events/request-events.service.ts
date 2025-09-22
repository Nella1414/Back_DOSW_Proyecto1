import { Injectable } from '@nestjs/common';
import { CreateRequestEventDto } from './dto/create-request-event.dto';
import { UpdateRequestEventDto } from './dto/update-request-event.dto';

@Injectable()
export class RequestEventsService {
  create(createRequestEventDto: CreateRequestEventDto) {
    return 'This action adds a new requestEvent';
  }

  findAll() {
    return `This action returns all requestEvents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} requestEvent`;
  }

  update(id: number, updateRequestEventDto: UpdateRequestEventDto) {
    return `This action updates a #${id} requestEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} requestEvent`;
  }
}
