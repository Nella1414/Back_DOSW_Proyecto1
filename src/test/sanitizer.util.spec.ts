import { SanitizerUtil } from '../common/utils/sanitizer.util';

describe('SanitizerUtil', () => {
  describe('sanitizeObservations', () => {
    it('should return null for empty string', () => {
      expect(SanitizerUtil.sanitizeObservations('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(SanitizerUtil.sanitizeObservations(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(SanitizerUtil.sanitizeObservations(undefined)).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      expect(SanitizerUtil.sanitizeObservations('   ')).toBeNull();
    });

    it('should sanitize basic text without changes', () => {
      const input = 'Esta es una observación normal.';
      expect(SanitizerUtil.sanitizeObservations(input)).toBe(input);
    });

    it('should throw error for null bytes', () => {
      const input = 'Texto con null byte\0aquí';
      expect(() => SanitizerUtil.sanitizeObservations(input)).toThrow(
        'La observación contiene caracteres null bytes no permitidos'
      );
    });

    it('should throw error for hex null bytes', () => {
      const input = 'Texto con\x00null byte';
      expect(() => SanitizerUtil.sanitizeObservations(input)).toThrow(
        'La observación contiene caracteres null bytes no permitidos'
      );
    });

    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Texto normal';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Texto normal');
    });

    it('should remove dangerous HTML attributes', () => {
      const input = '<div onclick="malicious()">Texto</div>';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('Texto');
    });

    it('should preserve line breaks', () => {
      const input = 'Línea 1\nLínea 2\nLínea 3';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toBe(input);
    });

    it('should normalize Windows line endings to Unix', () => {
      const input = 'Línea 1\r\nLínea 2';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toBe('Línea 1\nLínea 2');
    });

    it('should normalize Mac line endings to Unix', () => {
      const input = 'Línea 1\rLínea 2';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toBe('Línea 1\nLínea 2');
    });

    it('should limit consecutive line breaks to 2', () => {
      const input = 'Línea 1\n\n\n\n\nLínea 2';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toBe('Línea 1\n\nLínea 2');
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '   Texto con espacios   ';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toBe('Texto con espacios');
    });

    it('should remove control characters except tab, newline, carriage return', () => {
      const input = 'Texto\x01con\x02control\x03chars';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toBe('Textoconcontrolchars');
    });

    it('should preserve tabs', () => {
      const input = 'Texto\tcon\ttabulaciones';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('\t');
    });

    it('should sanitize MongoDB $where operator', () => {
      const input = 'Observación con $where injection';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).not.toContain('$where');
      expect(result).toContain('&#36;where');
    });

    it('should sanitize MongoDB $ne operator', () => {
      const input = 'Observación con $ne operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).not.toContain('$ne');
      expect(result).toContain('&#36;ne');
    });

    it('should sanitize MongoDB $gt operator', () => {
      const input = 'Observación con $gt operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;gt');
    });

    it('should sanitize MongoDB $gte operator', () => {
      const input = 'Observación con $gte operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;gte');
    });

    it('should sanitize MongoDB $lt operator', () => {
      const input = 'Observación con $lt operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;lt');
    });

    it('should sanitize MongoDB $lte operator', () => {
      const input = 'Observación con $lte operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;lte');
    });

    it('should sanitize MongoDB $or operator', () => {
      const input = 'Observación con $or operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;or');
    });

    it('should sanitize MongoDB $and operator', () => {
      const input = 'Observación con $and operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;and');
    });

    it('should sanitize MongoDB $not operator', () => {
      const input = 'Observación con $not operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;not');
    });

    it('should sanitize MongoDB $nor operator', () => {
      const input = 'Observación con $nor operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;nor');
    });

    it('should sanitize MongoDB $exists operator', () => {
      const input = 'Observación con $exists operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;exists');
    });

    it('should sanitize MongoDB $type operator', () => {
      const input = 'Observación con $type operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;type');
    });

    it('should sanitize MongoDB $regex operator', () => {
      const input = 'Observación con $regex operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;regex');
    });

    it('should sanitize MongoDB $expr operator', () => {
      const input = 'Observación con $expr operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;expr');
    });

    it('should sanitize MongoDB $function operator', () => {
      const input = 'Observación con $function operator';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;function');
    });

    it('should sanitize case-insensitive MongoDB operators', () => {
      const input = 'Observación con $WHERE y $NE';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;where');
      expect(result).toContain('&#36;ne');
    });

    it('should handle multiple MongoDB operators in one string', () => {
      const input = 'Injection con $where y $or y $gt';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('&#36;where');
      expect(result).toContain('&#36;or');
      expect(result).toContain('&#36;gt');
    });

    it('should handle complex real-world observation', () => {
      const input = `Estudiante destacado en matemáticas.
Requiere apoyo en inglés.

Observaciones adicionales:
- Participa activamente
- Buena asistencia`;
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toContain('Estudiante destacado');
      expect(result).toContain('Requiere apoyo');
      expect(result).toContain('Participa activamente');
    });

    it('should handle text with special characters', () => {
      const input = 'Observación con áéíóú ñ ¿? ¡!';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toBe(input);
    });

    it('should return null after sanitization if only whitespace remains', () => {
      const input = '   \n\n   ';
      const result = SanitizerUtil.sanitizeObservations(input);
      expect(result).toBeNull();
    });
  });

  describe('validateLength', () => {
    it('should return true for null input', () => {
      expect(SanitizerUtil.validateLength(null)).toBe(true);
    });

    it('should return true for text within default length', () => {
      const text = 'Esta es una observación corta.';
      expect(SanitizerUtil.validateLength(text)).toBe(true);
    });

    it('should return true for text exactly at max length', () => {
      const text = 'a'.repeat(2000);
      expect(SanitizerUtil.validateLength(text, 2000)).toBe(true);
    });

    it('should return false for text exceeding max length', () => {
      const text = 'a'.repeat(2001);
      expect(SanitizerUtil.validateLength(text, 2000)).toBe(false);
    });

    it('should use custom max length', () => {
      const text = 'a'.repeat(51);
      expect(SanitizerUtil.validateLength(text, 50)).toBe(false);
    });

    it('should return true for empty string', () => {
      expect(SanitizerUtil.validateLength('')).toBe(true);
    });

    it('should handle very long text correctly', () => {
      const text = 'a'.repeat(5000);
      expect(SanitizerUtil.validateLength(text, 2000)).toBe(false);
      expect(SanitizerUtil.validateLength(text, 10000)).toBe(true);
    });
  });

  describe('Integration: sanitize and validate together', () => {
    it('should sanitize and then validate length', () => {
      const input = '<script>alert("xss")</script>' + 'a'.repeat(1900);
      const sanitized = SanitizerUtil.sanitizeObservations(input);
      expect(sanitized).toBeDefined();
      expect(SanitizerUtil.validateLength(sanitized!, 2000)).toBe(true);
    });

    it('should handle malicious input with length validation', () => {
      const input = '$where attack with ' + 'a'.repeat(1900);
      const sanitized = SanitizerUtil.sanitizeObservations(input);
      expect(sanitized).toContain('&#36;where');
      expect(SanitizerUtil.validateLength(sanitized!, 2000)).toBe(true);
    });
  });
});
