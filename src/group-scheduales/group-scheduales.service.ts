import { Injectable } from '@nestjs/common';
import { CreateGroupSchedualeDto } from './dto/create-group-scheduale.dto';
import { UpdateGroupSchedualeDto } from './dto/update-group-scheduale.dto';

@Injectable()
export class GroupSchedualesService {
  create(createGroupSchedualeDto: CreateGroupSchedualeDto) {
    return 'This action adds a new groupScheduale';
  }

  findAll() {
    return `This action returns all groupScheduales`;
  }

  findOne(id: number) {
    return `This action returns a #${id} groupScheduale`;
  }

  update(id: number, updateGroupSchedualeDto: UpdateGroupSchedualeDto) {
    return `This action updates a #${id} groupScheduale`;
  }

  remove(id: number) {
    return `This action removes a #${id} groupScheduale`;
  }
}
