import { Module } from '@nestjs/common';
import { GroupSchedualesService } from './group-scheduales.service';
import { GroupSchedualesController } from './group-scheduales.controller';

@Module({
  controllers: [GroupSchedualesController],
  providers: [GroupSchedualesService],
})
export class GroupSchedualesModule {}
