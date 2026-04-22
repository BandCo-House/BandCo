import { ValidationArguments } from 'class-validator';

export const booleanValidationMessage = (args: ValidationArguments) => {
  return `${args.property}은(는) boolean이 입력되어야 합니다.`;
};
