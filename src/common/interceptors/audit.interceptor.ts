import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { AUDIT_CREATE_KEY } from '../decorators/audit-create.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const entityType = this.reflector.get<string>(
      AUDIT_CREATE_KEY,
      context.getHandler(),
    );

    if (!entityType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { user, body, ip, headers } = request;

    return next.handle().pipe(
      tap(async (response) => {
        if (response && response.id) {
          await this.auditService.logCreateEvent(
            response.id,
            user?.id || 'anonymous',
            {
              entityType,
              data: body,
              response: {
                id: response.id,
                status: 'created',
              },
            },
            ip,
            headers['user-agent'],
          );
        }
      }),
    );
  }
}