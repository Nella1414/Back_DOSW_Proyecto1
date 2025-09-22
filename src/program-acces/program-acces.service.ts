import { Injectable } from '@nestjs/common';
import { CreateProgramAcceDto } from './dto/create-program-acce.dto';
import { UpdateProgramAcceDto } from './dto/update-program-acce.dto';

@Injectable()
export class ProgramAccesService {
  create(createProgramAcceDto: CreateProgramAcceDto) {
    return 'This action adds a new programAcce';
  }

  findAll() {
    return `This action returns all programAcces`;
  }

  findOne(id: number) {
    return `This action returns a #${id} programAcce`;
  }

  update(id: number, updateProgramAcceDto: UpdateProgramAcceDto) {
    return `This action updates a #${id} programAcce`;
  }

  remove(id: number) {
    return `This action removes a #${id} programAcce`;
  }
}
