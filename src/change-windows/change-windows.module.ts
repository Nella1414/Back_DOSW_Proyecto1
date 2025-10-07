import { Module } from '@nestjs/common';
import { ChangeWindowsService } from './services/change-windows.service';
import { ChangeWindowsController } from './change-windows.controller';

@Module({
  controllers: [ChangeWindowsController],
  providers: [ChangeWindowsService],
})
export class ChangeWindowsModule {}
