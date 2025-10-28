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
  static sanitizeObservations(
    observations: string | null | undefined,
  ): string | null {
    // Si es null, undefined o string vacío, retornar null
    if (!observations || observations.trim() === '') {
      return null;
    }

    // Validar contra null bytes
    if (this.containsNullBytes(observations)) {
      throw new Error(
        'La observación contiene caracteres null bytes no permitidos',
      );
    }

    // Validar y remover caracteres de control peligrosos
    const cleanedControl = this.sanitizeControlCharacters(observations);

    // Sanitizar HTML peligroso pero mantener saltos de línea
    const sanitized = this.purify.sanitize(cleanedControl, {
      ALLOWED_TAGS: [], // No permitir tags HTML
      ALLOWED_ATTR: [], // No permitir atributos
      KEEP_CONTENT: true, // Mantener contenido de texto
    });

    // Proteger contra NoSQL injection (después de DOMPurify)
    const noSqlSafe = this.sanitizeNoSqlInjection(sanitized);

    // Normalizar saltos de línea y espacios
    const normalized = noSqlSafe
      .replace(/\r\n/g, '\n') // Normalizar line endings
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Max 2 saltos consecutivos
      .trim();

    return normalized || null;
  }

  /**
   * Valida si el texto contiene null bytes
   */
  private static containsNullBytes(text: string): boolean {
    return text.includes('\0') || /\x00/.test(text);
  }

  /**
   * Sanitiza caracteres de control peligrosos
   * Permite: \n (nueva línea), \r (retorno de carro), \t (tabulación)
   * Remueve: otros caracteres de control (0x00-0x1F excepto 0x09, 0x0A, 0x0D)
   */
  private static sanitizeControlCharacters(text: string): string {
    // Remover caracteres de control excepto \t (0x09), \n (0x0A), \r (0x0D)
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Protege contra inyección NoSQL
   */
  private static sanitizeNoSqlInjection(text: string): string {
    // Escapar caracteres especiales de MongoDB y otros NoSQL
    const dangerousPatterns = [
      { pattern: /\$where/gi, replacement: '&#36;where' },
      { pattern: /\$ne/gi, replacement: '&#36;ne' },
      { pattern: /\$gt/gi, replacement: '&#36;gt' },
      { pattern: /\$gte/gi, replacement: '&#36;gte' },
      { pattern: /\$lt/gi, replacement: '&#36;lt' },
      { pattern: /\$lte/gi, replacement: '&#36;lte' },
      { pattern: /\$or/gi, replacement: '&#36;or' },
      { pattern: /\$and/gi, replacement: '&#36;and' },
      { pattern: /\$not/gi, replacement: '&#36;not' },
      { pattern: /\$nor/gi, replacement: '&#36;nor' },
      { pattern: /\$exists/gi, replacement: '&#36;exists' },
      { pattern: /\$type/gi, replacement: '&#36;type' },
      { pattern: /\$regex/gi, replacement: '&#36;regex' },
      { pattern: /\$expr/gi, replacement: '&#36;expr' },
      { pattern: /\$function/gi, replacement: '&#36;function' },
    ];

    let sanitized = text;
    for (const { pattern, replacement } of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    return sanitized;
  }

  /**
   * Valida longitud de observaciones
   */
  static validateLength(
    observations: string | null,
    maxLength: number = 2000,
  ): boolean {
    if (!observations) return true;
    return observations.length <= maxLength;
  }
}
