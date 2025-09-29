import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FacultyService } from './services/faculty.service';
import { FacultyController } from './faculty.controller';
import { Faculty, FacultySchema } from './entities/faculty.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Faculty.name, schema: FacultySchema }
    ])
  ],
  controllers: [FacultyController],
  providers: [FacultyService],
  exports: [MongooseModule, FacultyService]
})
export class FacultyModule {}
