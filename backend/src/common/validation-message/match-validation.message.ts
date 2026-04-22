import { ValidationArguments } from 'class-validator';

export const matchValidationMessage = (args: ValidationArguments) => {
  const pattern = args.constraints[0];
  const label = pattern instanceof RegExp ? pattern.source : String(pattern);
  return `${args.property}은(는) ${label}의 패턴을 따라야합니다.`;
};
