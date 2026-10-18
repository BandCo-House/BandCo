import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterEmailDto } from './register-email.dto';

async function validateNickname(nickname: string): Promise<string[]> {
  const dto = plainToInstance(RegisterEmailDto, { email: 'user@example.com', password: 'Password123!', nickname });
  const errors = await validate(dto);

  return errors.map(error => error.property);
}

describe('RegisterEmailDto', () => {
  it('닉네임이 20자면 통과한다', async () => {
    expect(await validateNickname('가'.repeat(20))).toEqual([]);
  });

  it('닉네임이 21자면 nickname 검증에 실패한다', async () => {
    expect(await validateNickname('가'.repeat(21))).toEqual(['nickname']);
  });
});
