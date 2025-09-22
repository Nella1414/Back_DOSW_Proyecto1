import { Injectable } from '@nestjs/common';
import { CreateChangeWindowDto } from './dto/create-change-window.dto';
import { UpdateChangeWindowDto } from './dto/update-change-window.dto';

@Injectable()
export class ChangeWindowsService {
  create(createChangeWindowDto: CreateChangeWindowDto) {
    return 'This action adds a new changeWindow';
  }

  findAll() {
    return `This action returns all changeWindows`;
  }

  findOne(id: number) {
    return `This action returns a #${id} changeWindow`;
  }

  update(id: number, updateChangeWindowDto: UpdateChangeWindowDto) {
    return `This action updates a #${id} changeWindow`;
  }

  remove(id: number) {
    return `This action removes a #${id} changeWindow`;
  }
}
