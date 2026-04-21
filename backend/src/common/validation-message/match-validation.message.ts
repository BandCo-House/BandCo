import { ValidationArguments } from 'class-validator';

export const matchValidationMessage = (args: ValidationArguments) => {
  return `${args.property}은(는) ${args.constraints[0]}의 패턴을 따라야합니다.`;
};
