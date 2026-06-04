import type { ValidationArguments } from 'class-validator';

export const uuidValidationMessage = (args: ValidationArguments) => `${args.property}은(는) 유효한 uuid이어야 합니다.`;
