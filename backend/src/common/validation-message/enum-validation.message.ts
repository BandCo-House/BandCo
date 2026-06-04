import type { ValidationArguments } from 'class-validator';

export const enumValidationMessage = (args: ValidationArguments) => {
  const values = args.constraints[0];
  return `${args.property}은(는) ${values.join(', ')} 중 하나여야 합니다`;
};
