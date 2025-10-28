import { IsValidObservationsConstraint } from '../common/validators/observations.validator';
import { ValidationArguments } from 'class-validator';

describe('ObservationsValidator', () => {
  let validator: IsValidObservationsConstraint;
  
  const createMockValidationArguments = (constraints: any[]): ValidationArguments => ({
    targetName: 'TestClass',
    property: 'observations',
    object: {},
    value: '',
    constraints,
  });

  beforeEach(() => {
    validator = new IsValidObservationsConstraint();
  });

  describe('validate', () => {
    it('should accept null observations', () => {
      const args = createMockValidationArguments([2000]);
      expect(validator.validate(null, args)).toBe(true);
    });

    it('should accept short observation', () => {
      const args = createMockValidationArguments([2000]);
      const observation = 'Esta es una observación corta.';
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should accept observation at max length', () => {
      const args = createMockValidationArguments([100]);
      const observation = 'a'.repeat(100);
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should reject observation exceeding max length', () => {
      const args = createMockValidationArguments([100]);
      const observation = 'a'.repeat(101);
      expect(validator.validate(observation, args)).toBe(false);
    });

    it('should use default max length of 2000 when not specified', () => {
      const args = createMockValidationArguments([]);
      const observation = 'a'.repeat(2000);
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should reject observation exceeding default max length', () => {
      const args = createMockValidationArguments([]);
      const observation = 'a'.repeat(2001);
      expect(validator.validate(observation, args)).toBe(false);
    });

    it('should accept empty string', () => {
      const args = createMockValidationArguments([2000]);
      expect(validator.validate('', args)).toBe(true);
    });

    it('should accept observation with line breaks', () => {
      const args = createMockValidationArguments([200]);
      const observation = 'Línea 1\nLínea 2\nLínea 3';
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should accept observation with special characters', () => {
      const args = createMockValidationArguments([200]);
      const observation = 'Observación con áéíóú ñ ¿? ¡!';
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should handle custom max length', () => {
      const args = createMockValidationArguments([50]);
      const shortObs = 'a'.repeat(50);
      const longObs = 'a'.repeat(51);
      
      expect(validator.validate(shortObs, args)).toBe(true);
      expect(validator.validate(longObs, args)).toBe(false);
    });

    it('should handle very large max length', () => {
      const args = createMockValidationArguments([10000]);
      const observation = 'a'.repeat(5000);
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should handle small max length', () => {
      const args = createMockValidationArguments([10]);
      const observation = 'short';
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should reject when observation is exactly one char over limit', () => {
      const args = createMockValidationArguments([100]);
      const observation = 'a'.repeat(101);
      expect(validator.validate(observation, args)).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return message with default max length', () => {
      const args = createMockValidationArguments([]);
      const message = validator.defaultMessage(args);
      expect(message).toContain('2000 caracteres');
    });

    it('should return message with custom max length', () => {
      const args = createMockValidationArguments([500]);
      const message = validator.defaultMessage(args);
      expect(message).toContain('500 caracteres');
    });

    it('should return message with small max length', () => {
      const args = createMockValidationArguments([50]);
      const message = validator.defaultMessage(args);
      expect(message).toContain('50 caracteres');
    });

    it('should include "observaciones" in message', () => {
      const args = createMockValidationArguments([1000]);
      const message = validator.defaultMessage(args);
      expect(message).toContain('observaciones');
    });

    it('should include "no pueden exceder" in message', () => {
      const args = createMockValidationArguments([1000]);
      const message = validator.defaultMessage(args);
      expect(message).toContain('no pueden exceder');
    });
  });

  describe('Integration: Realistic scenarios', () => {
    it('should validate typical student observation', () => {
      const args = createMockValidationArguments([2000]);
      const observation = `Estudiante destacado en matemáticas.
Requiere apoyo en inglés.

Observaciones adicionales:
- Participa activamente en clase
- Buena asistencia
- Muestra interés en las actividades`;
      
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should reject extremely long observation', () => {
      const args = createMockValidationArguments([2000]);
      const observation = 'a'.repeat(3000);
      
      expect(validator.validate(observation, args)).toBe(false);
    });

    it('should handle multi-paragraph observation', () => {
      const args = createMockValidationArguments([5000]);
      const observation = `Primer párrafo con información relevante.

Segundo párrafo con más detalles.

Tercer párrafo con conclusiones.`;
      
      expect(validator.validate(observation, args)).toBe(true);
    });

    it('should validate observation at exact limit', () => {
      const args = createMockValidationArguments([100]);
      const observation = 'x'.repeat(100);
      
      expect(validator.validate(observation, args)).toBe(true);
      expect(validator.validate(observation + 'y', args)).toBe(false);
    });
  });
});
