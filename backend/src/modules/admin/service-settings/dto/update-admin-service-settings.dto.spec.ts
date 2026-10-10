import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateAdminServiceSettingsDto } from './update-admin-service-settings.dto';

const validateBody = (body: Record<string, unknown>) => validate(plainToInstance(UpdateAdminServiceSettingsDto, body));

describe('UpdateAdminServiceSettingsDto', () => {
  it('문자열 필드의 null은 값 비우기로 통과시킨다', async () => {
    const errors = await validateBody({ maintenanceMessage: null, minAppVersion: null });
    expect(errors).toHaveLength(0);
  });

  it('maintenanceEnabled의 null은 거부한다', async () => {
    const errors = await validateBody({ maintenanceEnabled: null });
    expect(errors.map(error => error.property)).toEqual(['maintenanceEnabled']);
  });

  it('x.y.z 형식의 최소 앱 버전을 통과시킨다', async () => {
    const errors = await validateBody({ minAppVersion: '10.2.31' });
    expect(errors).toHaveLength(0);
  });

  it.each(['1.2', 'v1.2.3', '1.2.3-beta', '1.2.3.4'])('형식이 다른 최소 앱 버전 %s는 거부한다', async minAppVersion => {
    const errors = await validateBody({ minAppVersion });
    expect(errors.map(error => error.property)).toEqual(['minAppVersion']);
  });

  it('500자를 넘는 점검 문구는 거부한다', async () => {
    const errors = await validateBody({ maintenanceMessage: '가'.repeat(501) });
    expect(errors.map(error => error.property)).toEqual(['maintenanceMessage']);
  });
});
