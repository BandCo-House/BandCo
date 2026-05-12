import type { ValidationArguments } from 'class-validator';

export const intValidationMessage = (args: ValidationArguments) => `${args.property}은(는) 정수가 입력되어야 합니다.`;
