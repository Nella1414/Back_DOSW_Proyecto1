import { Injectable } from '@nestjs/common';
import { CreateAcademicTrafficLightDto } from './dto/create-academic-traffic-light.dto';
import { UpdateAcademicTrafficLightDto } from './dto/update-academic-traffic-light.dto';

@Injectable()
export class AcademicTrafficLightService {
  create(createAcademicTrafficLightDto: CreateAcademicTrafficLightDto) {
    return 'This action adds a new academicTrafficLight';
  }

  findAll() {
    return `This action returns all academicTrafficLight`;
  }

  findOne(id: number) {
    return `This action returns a #${id} academicTrafficLight`;
  }

  update(id: number, updateAcademicTrafficLightDto: UpdateAcademicTrafficLightDto) {
    return `This action updates a #${id} academicTrafficLight`;
  }

  remove(id: number) {
    return `This action removes a #${id} academicTrafficLight`;
  }
}
