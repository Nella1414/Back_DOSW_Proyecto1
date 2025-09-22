import { Injectable } from '@nestjs/common';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';

@Injectable()
export class WaitlistsService {
  create(createWaitlistDto: CreateWaitlistDto) {
    return 'This action adds a new waitlist';
  }

  findAll() {
    return `This action returns all waitlists`;
  }

  findOne(id: number) {
    return `This action returns a #${id} waitlist`;
  }

  update(id: number, updateWaitlistDto: UpdateWaitlistDto) {
    return `This action updates a #${id} waitlist`;
  }

  remove(id: number) {
    return `This action removes a #${id} waitlist`;
  }
}
