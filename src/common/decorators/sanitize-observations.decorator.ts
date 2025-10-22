import { Transform } from 'class-transformer';
import { SanitizerUtil } from '../utils/sanitizer.util';

/**
 * Decorator para sanitizar observaciones automáticamente
 */
export function SanitizeObservations() {
  return Transform(({ value }) => {
    return SanitizerUtil.sanitizeObservations(value);
  });
}