import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { UserRole } from './schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(username: string, password: string, role: UserRole = UserRole.STUDENT): Promise<User> {
    const newUser = new this.userModel({ username, password, role, groupIds: [] });
    return newUser.save(); 
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async addGroup(userId: string, groupId: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { groupIds: groupId } }, 
      { new: true }
    ).exec();
  }
}
