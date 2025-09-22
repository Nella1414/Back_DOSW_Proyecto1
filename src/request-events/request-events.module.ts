import { Module } from '@nestjs/common';
import { RequestEventsService } from './request-events.service';
import { RequestEventsController } from './request-events.controller';

@Module({
  controllers: [RequestEventsController],
  providers: [RequestEventsService],
})
export class RequestEventsModule {}
