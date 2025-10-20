import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { SanitizerUtil } from '../utils/sanitizer.util';

/**
 * Validador para observaciones con límite de longitud
 */
@ValidatorConstraint({ name: 'isValidObservations', async: false })
export class IsValidObservationsConstraint implements ValidatorConstraintInterface {
  validate(observations: string | null, args: ValidationArguments) {
    const [maxLength] = args.constraints;
    return SanitizerUtil.validateLength(observations, maxLength || 2000);
  }

  defaultMessage(args: ValidationArguments) {
    const [maxLength] = args.constraints;
    return `Las observaciones no pueden exceder ${maxLength || 2000} caracteres`;
  }
}

export function IsValidObservations(maxLength: number = 2000, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [maxLength],
      validator: IsValidObservationsConstraint,
    });
  };
}