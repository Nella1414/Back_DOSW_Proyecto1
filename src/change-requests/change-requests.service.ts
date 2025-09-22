import { Injectable } from '@nestjs/common';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { UpdateChangeRequestDto } from './dto/update-change-request.dto';

@Injectable()
export class ChangeRequestsService {
  create(createChangeRequestDto: CreateChangeRequestDto) {
    return 'This action adds a new changeRequest';
  }

  findAll() {
    return `This action returns all changeRequests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} changeRequest`;
  }

  update(id: number, updateChangeRequestDto: UpdateChangeRequestDto) {
    return `This action updates a #${id} changeRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} changeRequest`;
  }
}
