import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditRequest, AuditRequestSchema } from './entities/audit-request.entity';
import { AuditService } from './services/audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditRequest.name, schema: AuditRequestSchema },
    ]),
  ],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}