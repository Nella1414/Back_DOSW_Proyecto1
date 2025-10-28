import { SetMetadata } from '@nestjs/common';

export const AUDIT_CREATE_KEY = 'audit_create';

/**
 * Decorator para marcar endpoints que requieren auditoría automática
 */
export const AuditCreate = (entityType: string) =>
  SetMetadata(AUDIT_CREATE_KEY, entityType);
