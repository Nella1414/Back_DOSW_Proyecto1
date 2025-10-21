import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
} from '../../academic-periods/entities/academic-period.entity';

@Injectable()
export class PeriodActiveGuard implements CanActivate {
  constructor(
    @InjectModel(AcademicPeriod.name)
    private academicPeriodModel: Model<AcademicPeriodDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if there's an active period that allows change requests
    const activePeriod = await this.academicPeriodModel
      .findOne({
        isActive: true,
        allowChangeRequests: true,
      })
      .exec();

    if (!activePeriod) {
      throw new BadRequestException(
        'No active academic period that allows change requests',
      );
    }

    // Add period info to request for later use
    request.activePeriod = activePeriod;
    return true;
  }
}
