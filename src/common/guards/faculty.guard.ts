import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faculty, FacultyDocument } from '../../faculty/entities/faculty.entity';
import { Program, ProgramDocument } from '../../programs/entities/program.entity';
import { Student, StudentDocument } from '../../students/entities/student.entity';
import { User, UserDocument } from '../../users/entities/user.entity';

@Injectable()
export class FacultyGuard implements CanActivate {
  constructor(
    @InjectModel(Faculty.name) private facultyModel: Model<FacultyDocument>,
    @InjectModel(Program.name) private programModel: Model<ProgramDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const facultyId = request.params.facultyId;

    if (!user || !facultyId) {
      throw new ForbiddenException('User or faculty information missing');
    }

    // Check if user is DEAN of the requested faculty
    const faculty = await this.facultyModel.findById(facultyId).exec();
    if (!faculty) {
      throw new ForbiddenException('Faculty not found');
    }

    const userDoc = await this.userModel.findOne({ email: user.email }).exec();
    if (!userDoc) {
      throw new ForbiddenException('User not found');
    }

    // Allow if user is DEAN of this faculty
    if (faculty.deanId && faculty.deanId === (userDoc._id as string)) {
      return true;
    }

    // Allow if user has ADMIN role
    if (userDoc.roles.includes('ADMIN')) {
      return true;
    }

    throw new ForbiddenException('Access denied: You can only access your own faculty data');
  }
}