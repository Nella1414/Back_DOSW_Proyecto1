import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Request, RequestSchema } from './schema/request.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }])],
  providers: [RequestsService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
