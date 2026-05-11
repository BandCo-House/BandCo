import type { ValidationArguments } from 'class-validator';

export const iso8601ValidationMessage = (args: ValidationArguments) => `${args.property}은(는) iso8601 date 형태여야합니다.`;
