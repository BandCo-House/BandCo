import type { ValidationArguments } from 'class-validator';

export const notemptyValidationMessage = (args: ValidationArguments) => `${args.property}은(는) 비어있을 수 없습니다.`;
