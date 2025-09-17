import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, RequestDocument } from './schema/request.schema';

@Injectable()
export class RequestsService {
  constructor(@InjectModel(Request.name) private requestModel: Model<RequestDocument>) {}

  async create(studentId: string, fromGroupId: string, toGroupId: string) {
    const request = new this.requestModel({ studentId, fromGroupId, toGroupId });
    return request.save();
  }

  async findAll() {
    return this.requestModel.find().populate('studentId fromGroupId toGroupId').exec();
  }

  async findById(id: string) {
    return this.requestModel.findById(id).populate('studentId fromGroupId toGroupId').exec();
  }

  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    return this.requestModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }
}
