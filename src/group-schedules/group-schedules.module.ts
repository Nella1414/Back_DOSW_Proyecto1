import { Module } from '@nestjs/common';
import { GroupSchedulesService } from './group-schedules.service';
import { GroupSchedulesController } from './group-schedules.controller';

@Module({
  controllers: [GroupSchedulesController],
  providers: [GroupSchedulesService],
})
export class GroupSchedulesModule {}
