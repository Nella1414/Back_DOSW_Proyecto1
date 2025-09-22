import { Module } from '@nestjs/common';
import { WaitlistsService } from './waitlists.service';
import { WaitlistsController } from './waitlists.controller';

@Module({
  controllers: [WaitlistsController],
  providers: [WaitlistsService],
})
export class WaitlistsModule {}
