import type { ValidationArguments } from 'class-validator';

export const urlValidationMessage = (args: ValidationArguments) => `${args.property}은(는) 올바른 URL 형식이어야 합니다.`;
