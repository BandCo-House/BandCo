import type { ValidationArguments } from 'class-validator';

export const coordinateValidationMessage = (args: ValidationArguments) => `${args.property}은(는) 올바른 좌표 범위로 입력해주세요`;
