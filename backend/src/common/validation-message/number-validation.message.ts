import type { ValidationArguments } from 'class-validator';

export const numberValidationMessage = (args: ValidationArguments) => `${args.property}은(는) 숫자가 입력되어야 합니다.`;
