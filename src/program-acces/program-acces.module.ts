import { Module } from '@nestjs/common';
import { ProgramAccesService } from './program-acces.service';
import { ProgramAccesController } from './program-acces.controller';

@Module({
  controllers: [ProgramAccesController],
  providers: [ProgramAccesService],
})
export class ProgramAccesModule {}
