import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Subject, SubjectSchema } from './schema/subjects.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }])],
  providers: [SubjectsService],
  controllers: [SubjectsController],
  exports: [SubjectsService],
})
export class SubjectsModule {}
