import type { ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
import { ValidatorConstraint } from 'class-validator';

/**
 * 종료일이 시작일보다 앞서지 않는지 확인한다.
 *
 * 날짜 형식 검증은 각 필드에서 이미 처리하므로,
 * 여기서는 두 날짜의 상대적인 순서만 본다.
 */
@ValidatorConstraint({ name: 'endDateNotBeforeStartDate', async: false })
export class EndDateNotBeforeStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: unknown, validationArguments: ValidationArguments): boolean {
    const target = validationArguments.object as {
      startDate?: unknown;
    };

    if (typeof target.startDate !== 'string') {
      return true;
    }

    if (typeof endDate !== 'string') {
      return true;
    }

    return target.startDate <= endDate;
  }

  defaultMessage(): string {
    return 'startDate는 endDate보다 늦을 수 없습니다.';
  }
}
