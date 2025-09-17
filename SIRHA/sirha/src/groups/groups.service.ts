import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schema/group.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  async create(subjectId: string, code: string, schedule: string, capacity: number): Promise<Group> {
    const newGroup = new this.groupModel({ subjectId, code, schedule, capacity });
    return newGroup.save();
  }

  async findAll(): Promise<Group[]> {
    return this.groupModel.find().populate('subjectId').exec();
  }

  async findById(id: string): Promise<Group | null> {
    return this.groupModel.findById(id).populate('subjectId').exec();
  }

  async findMany(ids: string[]): Promise<Group[]> {
    return this.groupModel.find({ _id: { $in: ids } }).populate('subjectId').exec();
  }
}
