import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditRequest, AuditRequestSchema } from './entities/audit-request.entity';
import { RadicadoCounter, RadicadoCounterSchema } from './entities/radicado-counter.entity';
import { AuditService } from './services/audit.service';
import { RadicadoService } from './services/radicado.service';
import { PriorityCalculatorService } from './services/priority-calculator.service';
import { RoutingService } from './services/routing.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditRequest.name, schema: AuditRequestSchema },
      { name: RadicadoCounter.name, schema: RadicadoCounterSchema },
    ]),
  ],
  providers: [AuditService, RadicadoService, PriorityCalculatorService, RoutingService, AuditInterceptor],
  exports: [AuditService, RadicadoService, PriorityCalculatorService, RoutingService, AuditInterceptor],
})
export class AuditModule {}