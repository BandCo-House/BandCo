import type { ValidationArguments } from 'class-validator';

export const emailValidationMessage = (args: ValidationArguments) => `${args.property}은(는) 올바른 이메일 형식이어야 합니다.`;
