import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validador personalizado para códigos de estudiante
 */
@ValidatorConstraint({ name: 'isStudentCode', async: false })
export class IsStudentCodeConstraint implements ValidatorConstraintInterface {
  validate(code: string, args: ValidationArguments) {
    if (!code) return false;

    // Formato: 3-4 letras seguidas de 3-6 números (ej: EST001, PROG2024)
    const studentCodeRegex = /^[A-Z]{3,4}\d{3,6}$/;
    return studentCodeRegex.test(code);
  }

  defaultMessage(args: ValidationArguments) {
    return 'El código debe tener 3-4 letras mayúsculas seguidas de 3-6 números (ej: EST001)';
  }
}

export function IsStudentCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStudentCodeConstraint,
    });
  };
}

/**
 * Validador para nombres (solo letras, espacios y acentos)
 */
@ValidatorConstraint({ name: 'isValidName', async: false })
export class IsValidNameConstraint implements ValidatorConstraintInterface {
  validate(name: string, args: ValidationArguments) {
    if (!name) return false;

    // Permite letras, espacios, acentos y caracteres especiales del español
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    return nameRegex.test(name.trim());
  }

  defaultMessage(args: ValidationArguments) {
    return 'El nombre solo puede contener letras, espacios y acentos';
  }
}

export function IsValidName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidNameConstraint,
    });
  };
}

/**
 * Validador para contraseñas seguras
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string, args: ValidationArguments) {
    if (!password) return false;

    // Al menos 8 caracteres, una mayúscula, una minúscula, un número
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  defaultMessage(args: ValidationArguments) {
    return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

/**
 * NOTA: Para validar MongoDB ObjectIds, usar el decorador nativo de class-validator:
 * import { IsMongoId } from 'class-validator';
 *
 * Ejemplo de uso:
 * @IsMongoId({ message: 'Debe ser un ID válido de MongoDB' })
 * programId: string;
 */
