import { ValidationArguments } from 'class-validator';

export const minValidationMessage = (args: ValidationArguments) => {
  return `${args.property}은(는) ${args.constraints[0]} 이상을 입력해주세요`;
};
