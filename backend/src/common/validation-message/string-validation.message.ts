import { ValidationArguments } from 'class-validator';

export const stringValidationMessage = (args: ValidationArguments) => {
  return `${args.property}은(는) 문자열이 입력되어야 합니다.`;
};
