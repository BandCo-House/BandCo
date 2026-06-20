import type { ValidationArguments } from 'class-validator';

export const maxValidationMessage = (args: ValidationArguments) => `${args.property}은(는) ${args.constraints[0]} 이하를 입력해주세요`;
