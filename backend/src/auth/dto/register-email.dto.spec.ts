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

  it('변형 선택자가 붙은 이모지는 코드 포인트마다 한 글자로 세어 DB 길이를 넘으면 실패한다', async () => {
    // '❤️'는 U+2764 + U+FE0F 두 코드 포인트라 11개면 DB 기준 22자다
    expect(await validateNickname('❤️'.repeat(11))).toEqual(['nickname']);
  });

  it('서로게이트 쌍 이모지 20개는 20자로 세어 통과한다', async () => {
    expect(await validateNickname('🎸'.repeat(20))).toEqual([]);
  });
});
