import { ValidationArguments } from 'class-validator';

export const isoValidationMessage = (args: ValidationArguments) => {
  return `${args.property}은(는) iso date 형태여야합니다.`;
};
