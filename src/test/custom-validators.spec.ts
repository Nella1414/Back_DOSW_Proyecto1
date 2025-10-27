import {
  IsStudentCodeConstraint,
  IsValidNameConstraint,
  IsStrongPasswordConstraint,
} from '../common/validators/custom-validators';
import { ValidationArguments } from 'class-validator';

describe('Custom Validators', () => {
  const mockValidationArguments: ValidationArguments = {
    targetName: 'TestClass',
    property: 'testProperty',
    object: {},
    value: '',
    constraints: [],
  };

  describe('IsStudentCodeConstraint', () => {
    let validator: IsStudentCodeConstraint;

    beforeEach(() => {
      validator = new IsStudentCodeConstraint();
    });

    describe('validate', () => {
      it('should accept valid student code with 3 letters and 3 numbers', () => {
        expect(validator.validate('EST001', mockValidationArguments)).toBe(true);
      });

      it('should accept valid student code with 4 letters and 4 numbers', () => {
        expect(validator.validate('PROG2024', mockValidationArguments)).toBe(true);
      });

      it('should accept valid student code with 3 letters and 6 numbers', () => {
        expect(validator.validate('SIS202401', mockValidationArguments)).toBe(true);
      });

      it('should accept valid student code with 4 letters and 6 numbers', () => {
        expect(validator.validate('MATH123456', mockValidationArguments)).toBe(true);
      });

      it('should reject code with lowercase letters', () => {
        expect(validator.validate('est001', mockValidationArguments)).toBe(false);
      });

      it('should reject code with mixed case letters', () => {
        expect(validator.validate('Est001', mockValidationArguments)).toBe(false);
      });

      it('should reject code with only 2 letters', () => {
        expect(validator.validate('ES001', mockValidationArguments)).toBe(false);
      });

      it('should reject code with 5 letters', () => {
        expect(validator.validate('ESTUD001', mockValidationArguments)).toBe(false);
      });

      it('should reject code with only 2 numbers', () => {
        expect(validator.validate('EST01', mockValidationArguments)).toBe(false);
      });

      it('should reject code with 7 numbers', () => {
        expect(validator.validate('EST1234567', mockValidationArguments)).toBe(false);
      });

      it('should reject code with special characters', () => {
        expect(validator.validate('EST-001', mockValidationArguments)).toBe(false);
      });

      it('should reject code with spaces', () => {
        expect(validator.validate('EST 001', mockValidationArguments)).toBe(false);
      });

      it('should reject empty string', () => {
        expect(validator.validate('', mockValidationArguments)).toBe(false);
      });

      it('should reject null', () => {
        expect(validator.validate(null as any, mockValidationArguments)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(validator.validate(undefined as any, mockValidationArguments)).toBe(false);
      });

      it('should reject code with letters after numbers', () => {
        expect(validator.validate('001EST', mockValidationArguments)).toBe(false);
      });

      it('should reject code with mixed letters and numbers', () => {
        expect(validator.validate('E1S2T3', mockValidationArguments)).toBe(false);
      });
    });

    describe('defaultMessage', () => {
      it('should return appropriate error message', () => {
        const message = validator.defaultMessage(mockValidationArguments);
        expect(message).toContain('3-4 letras');
        expect(message).toContain('3-6 números');
      });
    });
  });

  describe('IsValidNameConstraint', () => {
    let validator: IsValidNameConstraint;

    beforeEach(() => {
      validator = new IsValidNameConstraint();
    });

    describe('validate', () => {
      it('should accept simple name', () => {
        expect(validator.validate('Juan', mockValidationArguments)).toBe(true);
      });

      it('should accept name with multiple words', () => {
        expect(validator.validate('Juan Carlos', mockValidationArguments)).toBe(true);
      });

      it('should accept name with accents', () => {
        expect(validator.validate('José María', mockValidationArguments)).toBe(true);
      });

      it('should accept name with ñ', () => {
        expect(validator.validate('Niño', mockValidationArguments)).toBe(true);
      });

      it('should accept name with Ñ', () => {
        expect(validator.validate('NIÑO', mockValidationArguments)).toBe(true);
      });

      it('should accept name with ü', () => {
        expect(validator.validate('Güemes', mockValidationArguments)).toBe(true);
      });

      it('should accept name with all Spanish accents', () => {
        expect(validator.validate('Áéíóú', mockValidationArguments)).toBe(true);
      });

      it('should accept name with uppercase accents', () => {
        expect(validator.validate('ÁÉÍÓÚ', mockValidationArguments)).toBe(true);
      });

      it('should accept name with leading/trailing spaces', () => {
        expect(validator.validate('  Juan  ', mockValidationArguments)).toBe(true);
      });

      it('should reject name with numbers', () => {
        expect(validator.validate('Juan123', mockValidationArguments)).toBe(false);
      });

      it('should reject name with special characters', () => {
        expect(validator.validate('Juan@', mockValidationArguments)).toBe(false);
      });

      it('should reject name with hyphens', () => {
        expect(validator.validate('Juan-Carlos', mockValidationArguments)).toBe(false);
      });

      it('should reject name with underscores', () => {
        expect(validator.validate('Juan_Carlos', mockValidationArguments)).toBe(false);
      });

      it('should reject name with dots', () => {
        expect(validator.validate('Juan.Carlos', mockValidationArguments)).toBe(false);
      });

      it('should reject empty string', () => {
        expect(validator.validate('', mockValidationArguments)).toBe(false);
      });

      it('should reject null', () => {
        expect(validator.validate(null as any, mockValidationArguments)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(validator.validate(undefined as any, mockValidationArguments)).toBe(false);
      });

      it('should reject whitespace-only string', () => {
        expect(validator.validate('   ', mockValidationArguments)).toBe(false);
      });
    });

    describe('defaultMessage', () => {
      it('should return appropriate error message', () => {
        const message = validator.defaultMessage(mockValidationArguments);
        expect(message).toContain('letras');
        expect(message).toContain('espacios');
        expect(message).toContain('acentos');
      });
    });
  });

  describe('IsStrongPasswordConstraint', () => {
    let validator: IsStrongPasswordConstraint;

    beforeEach(() => {
      validator = new IsStrongPasswordConstraint();
    });

    describe('validate', () => {
      it('should accept strong password with minimum requirements', () => {
        expect(validator.validate('Password1', mockValidationArguments)).toBe(true);
      });

      it('should accept password with special characters', () => {
        expect(validator.validate('Pass@word1', mockValidationArguments)).toBe(true);
      });

      it('should accept password with multiple special characters', () => {
        expect(validator.validate('P@ssw0rd!', mockValidationArguments)).toBe(true);
      });

      it('should accept long password', () => {
        expect(validator.validate('VeryLongPassword123', mockValidationArguments)).toBe(true);
      });

      it('should accept password with all allowed special chars', () => {
        expect(validator.validate('P@ssw0rd$!%*?&', mockValidationArguments)).toBe(true);
      });

      it('should reject password shorter than 8 characters', () => {
        expect(validator.validate('Pass1', mockValidationArguments)).toBe(false);
      });

      it('should reject password exactly 7 characters', () => {
        expect(validator.validate('Pass123', mockValidationArguments)).toBe(false);
      });

      it('should reject password without uppercase', () => {
        expect(validator.validate('password1', mockValidationArguments)).toBe(false);
      });

      it('should reject password without lowercase', () => {
        expect(validator.validate('PASSWORD1', mockValidationArguments)).toBe(false);
      });

      it('should reject password without numbers', () => {
        expect(validator.validate('Password', mockValidationArguments)).toBe(false);
      });

      it('should reject password with only uppercase and numbers', () => {
        expect(validator.validate('PASSWORD123', mockValidationArguments)).toBe(false);
      });

      it('should reject password with only lowercase and numbers', () => {
        expect(validator.validate('password123', mockValidationArguments)).toBe(false);
      });

      it('should reject password with only letters', () => {
        expect(validator.validate('PasswordOnly', mockValidationArguments)).toBe(false);
      });

      it('should reject empty string', () => {
        expect(validator.validate('', mockValidationArguments)).toBe(false);
      });

      it('should reject null', () => {
        expect(validator.validate(null as any, mockValidationArguments)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(validator.validate(undefined as any, mockValidationArguments)).toBe(false);
      });

      it('should reject password with spaces', () => {
        expect(validator.validate('Pass word1', mockValidationArguments)).toBe(false);
      });

      it('should reject password with invalid special characters', () => {
        expect(validator.validate('Password1#', mockValidationArguments)).toBe(false);
      });

      it('should accept password exactly 8 characters', () => {
        expect(validator.validate('Passw0rd', mockValidationArguments)).toBe(true);
      });
    });

    describe('defaultMessage', () => {
      it('should return appropriate error message', () => {
        const message = validator.defaultMessage(mockValidationArguments);
        expect(message).toContain('8 caracteres');
        expect(message).toContain('mayúscula');
        expect(message).toContain('minúscula');
        expect(message).toContain('número');
      });
    });
  });

  describe('Integration: Multiple validators', () => {
    it('should validate student data with multiple validators', () => {
      const studentCodeValidator = new IsStudentCodeConstraint();
      const nameValidator = new IsValidNameConstraint();

      const studentCode = 'EST2024';
      const firstName = 'Juan Carlos';
      const lastName = 'García';

      expect(studentCodeValidator.validate(studentCode, mockValidationArguments)).toBe(true);
      expect(nameValidator.validate(firstName, mockValidationArguments)).toBe(true);
      expect(nameValidator.validate(lastName, mockValidationArguments)).toBe(true);
    });

    it('should reject invalid student data', () => {
      const studentCodeValidator = new IsStudentCodeConstraint();
      const nameValidator = new IsValidNameConstraint();

      const invalidCode = 'est2024'; // lowercase
      const invalidName = 'Juan123'; // with numbers

      expect(studentCodeValidator.validate(invalidCode, mockValidationArguments)).toBe(false);
      expect(nameValidator.validate(invalidName, mockValidationArguments)).toBe(false);
    });
  });
});
