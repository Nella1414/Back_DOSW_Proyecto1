import { Module } from '@nestjs/common';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestsController } from './change-requests.controller';

@Module({
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
