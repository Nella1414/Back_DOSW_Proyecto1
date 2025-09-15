import { Injectable } from '@nestjs/common';
import { Subject } from '../common/interfaces';

@Injectable()
export class SubjectsService {
  private subjects: Subject[] = [];
  private idCounter = 1;

  create(code: string, name: string) {
    const s: Subject = { id: this.idCounter++, code, name };
    this.subjects.push(s);
    return s;
  }
  findAll() { return this.subjects; }
}
