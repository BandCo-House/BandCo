import { ValidationArguments } from 'class-validator';

export const dateValidationMessage = (args: ValidationArguments) => {
  return `${args.property}은(는) ISO-8601 형식의 날짜여야 합니다.`;
};
