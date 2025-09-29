import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgramsService } from './services/programs.service';
import { ProgramsController } from './programs.controller';
import { Program, ProgramSchema } from './entities/program.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Program.name, schema: ProgramSchema }
    ])
  ],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [MongooseModule, ProgramsService]
})
export class ProgramsModule {}
