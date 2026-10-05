import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateAdminDto } from './admin-accounts.dto';

const validateBody = (body: Record<string, unknown>) =>
  validate(plainToInstance(CreateAdminDto, { email: 'op@bandco.kr', name: '운영자', password: 'password1', role: 'OPERATOR', ...body }));

describe('CreateAdminDto', () => {
  it('정의된 역할이면 통과한다', async () => {
    const errors = await validateBody({});
    expect(errors).toHaveLength(0);
  });

  // IsEnum에 Prisma enum 객체를 넘기면 enumValidationMessage가 join을 호출하다 500이 났다
  it('없는 역할이면 허용 값 목록을 담은 400 메시지를 만든다', async () => {
    const errors = await validateBody({ role: 'ROOT' });
    expect(errors[0].constraints).toEqual({ isIn: 'role은(는) SUPER_ADMIN, OPERATOR 중 하나여야 합니다' });
  });
});
