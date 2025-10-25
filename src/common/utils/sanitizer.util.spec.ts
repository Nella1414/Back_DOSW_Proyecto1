import { SanitizerUtil } from './sanitizer.util';

describe('SanitizerUtil', () => {
  describe('sanitizeObservations', () => {
    it('debe retornar null para valores vacíos', () => {
      expect(SanitizerUtil.sanitizeObservations(null)).toBeNull();
      expect(SanitizerUtil.sanitizeObservations(undefined)).toBeNull();
      expect(SanitizerUtil.sanitizeObservations('')).toBeNull();
      expect(SanitizerUtil.sanitizeObservations('   ')).toBeNull();
    });

    it('debe remover tags HTML', () => {
      const input = '<script>alert("XSS")</script>Texto limpio';
      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).toBe('Texto limpio');
      expect(result).not.toContain('<script>');
    });

    it('debe escapar operadores MongoDB', () => {
      const input = 'Test $where operator and $ne filter';
      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).toContain('&#36;where');
      expect(result).toContain('&#36;ne');
      expect(result).not.toContain('$where');
      expect(result).not.toContain('$ne');
    });

    it('debe remover caracteres de control peligrosos', () => {
      const input = 'Textocon\x01caracteres\x02de\x03control';
      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).not.toContain('\x01');
      expect(result).not.toContain('\x02');
      expect(result).not.toContain('\x03');
      expect(result).toBe('Textoconcaracteresdecontrol');
    });

    it('debe lanzar error si contiene null bytes', () => {
      const input = 'Texto con null byte: \0';

      expect(() => SanitizerUtil.sanitizeObservations(input)).toThrow(
        'La observación contiene caracteres null bytes no permitidos'
      );
    });

    it('debe preservar saltos de línea', () => {
      const input = 'Línea 1\nLínea 2\rLínea 3\r\nLínea 4';
      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).toContain('\n');
      expect(result).toBe('Línea 1\nLínea 2\nLínea 3\nLínea 4');
    });

    it('debe preservar tabulaciones', () => {
      const input = 'Col1\tCol2\tCol3';
      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).toContain('\t');
      expect(result).toBe('Col1\tCol2\tCol3');
    });

    it('debe limitar saltos de línea consecutivos a 2', () => {
      const input = 'Párrafo 1\n\n\n\n\nPárrafo 2';
      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).toBe('Párrafo 1\n\nPárrafo 2');
    });

    it('debe normalizar diferentes tipos de saltos de línea', () => {
      const input = 'Línea 1\r\nLínea 2\rLínea 3\nLínea 4';
      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).toBe('Línea 1\nLínea 2\nLínea 3\nLínea 4');
    });

    it('debe escapar todos los operadores NoSQL peligrosos', () => {
      const operators = [
        '$where', '$ne', '$gt', '$gte', '$lt', '$lte',
        '$or', '$and', '$not', '$nor', '$exists',
        '$type', '$regex', '$expr', '$function'
      ];

      for (const op of operators) {
        const input = `Test with ${op} operator`;
        const result = SanitizerUtil.sanitizeObservations(input);

        expect(result).not.toContain(op);
        expect(result).toContain('&#36;');
      }
    });

    it('debe manejar texto complejo con múltiples amenazas', () => {
      const input = `
        <script>alert('XSS')</script>
        $where: function() { return true; }
        Texto\x01con\x02control
        Normal text
      `;

      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('$where');
      expect(result).not.toContain('\x01');
      expect(result).toContain('Normal text');
    });

    it('debe recortar espacios al inicio y final', () => {
      const input = '   Texto con espacios   ';
      const result = SanitizerUtil.sanitizeObservations(input);

      expect(result).toBe('Texto con espacios');
    });
  });

  describe('validateLength', () => {
    it('debe retornar true para textos dentro del límite', () => {
      expect(SanitizerUtil.validateLength('Texto corto', 100)).toBe(true);
      expect(SanitizerUtil.validateLength('a'.repeat(2000), 2000)).toBe(true);
    });

    it('debe retornar false para textos que exceden el límite', () => {
      expect(SanitizerUtil.validateLength('a'.repeat(2001), 2000)).toBe(false);
      expect(SanitizerUtil.validateLength('Texto largo', 5)).toBe(false);
    });

    it('debe retornar true para null', () => {
      expect(SanitizerUtil.validateLength(null, 100)).toBe(true);
    });

    it('debe usar 2000 como límite por defecto', () => {
      expect(SanitizerUtil.validateLength('a'.repeat(2000))).toBe(true);
      expect(SanitizerUtil.validateLength('a'.repeat(2001))).toBe(false);
    });

    it('debe validar con límites personalizados', () => {
      expect(SanitizerUtil.validateLength('abc', 5)).toBe(true);
      expect(SanitizerUtil.validateLength('abcdef', 5)).toBe(false);
    });
  });
});
