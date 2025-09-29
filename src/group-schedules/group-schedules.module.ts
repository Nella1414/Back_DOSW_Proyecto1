import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupSchedulesService } from './services/group-schedules.service';
import { GroupSchedulesController } from './group-schedules.controller';
import { GroupSchedule, GroupScheduleSchema } from './entities/group-schedule.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupSchedule.name, schema: GroupScheduleSchema }
    ])
  ],
  controllers: [GroupSchedulesController],
  providers: [GroupSchedulesService],
  exports: [MongooseModule, GroupSchedulesService]
})
export class GroupSchedulesModule {}
