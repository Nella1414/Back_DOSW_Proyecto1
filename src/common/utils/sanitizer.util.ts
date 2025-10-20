import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

/**
 * Utilidad para sanitizar observaciones de forma segura
 */
export class SanitizerUtil {
  private static purify: any;

  static {
    const window = new JSDOM('').window;
    this.purify = DOMPurify(window as any);
  }

  /**
   * Sanitiza observaciones manteniendo formato básico
   */
  static sanitizeObservations(observations: string | null | undefined): string | null {
    // Si es null, undefined o string vacío, retornar null
    if (!observations || observations.trim() === '') {
      return null;
    }

    // Sanitizar HTML peligroso pero mantener saltos de línea
    const sanitized = this.purify.sanitize(observations, {
      ALLOWED_TAGS: [], // No permitir tags HTML
      ALLOWED_ATTR: [], // No permitir atributos
      KEEP_CONTENT: true, // Mantener contenido de texto
    });

    // Normalizar saltos de línea y espacios
    const normalized = sanitized
      .replace(/\r\n/g, '\n') // Normalizar line endings
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Max 2 saltos consecutivos
      .trim();

    return normalized || null;
  }

  /**
   * Valida longitud de observaciones
   */
  static validateLength(observations: string | null, maxLength: number = 2000): boolean {
    if (!observations) return true;
    return observations.length <= maxLength;
  }
}