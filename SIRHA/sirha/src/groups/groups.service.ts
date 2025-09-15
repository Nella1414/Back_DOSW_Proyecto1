import { Injectable } from '@nestjs/common';
import { Group } from '../common/interfaces';

@Injectable()
export class GroupsService {
  private groups: Group[] = [];
  private idCounter = 1;

  create(subjectId: number, code: string, schedule: string, capacity: number) {
    const g: Group = { id: this.idCounter++, subjectId, code, schedule, capacity };
    this.groups.push(g);
    return g;
  }

  findAll() { return this.groups; }

  findById(id: number) { return this.groups.find(g => g.id === id); }

  findMany(ids: number[]) {
    return this.groups.filter(g => ids.includes(g.id));
  }
}
