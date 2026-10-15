import { describe, expect, it } from 'vitest';
import { serviceStatusSchema } from './schema';

describe('serviceStatusSchema', () => {
  it('점검 문구와 최소 버전이 null인 기본 응답을 통과시킨다', () => {
    expect(
      serviceStatusSchema.parse({
        maintenanceEnabled: false,
        maintenanceMessage: null,
        minAppVersion: null,
      }),
    ).toEqual({
      maintenanceEnabled: false,
      maintenanceMessage: null,
      minAppVersion: null,
    });
  });

  it('maintenanceEnabled가 boolean이 아니면 실패한다', () => {
    expect(
      serviceStatusSchema.safeParse({
        maintenanceEnabled: 'true',
        maintenanceMessage: null,
        minAppVersion: null,
      }).success,
    ).toBe(false);
  });

  it('필드가 누락되면 실패한다', () => {
    expect(
      serviceStatusSchema.safeParse({ maintenanceEnabled: true }).success,
    ).toBe(false);
  });
});
