import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateUserProfileDto } from './update-user-profile.dto';

async function validateNickname(nickname: string): Promise<string[]> {
  const dto = plainToInstance(UpdateUserProfileDto, { profile: { nickname } });
  const errors = await validate(dto);

  return errors.map(error => error.property);
}

describe('UpdateUserProfileDto', () => {
  it('닉네임이 20자면 통과한다', async () => {
    expect(await validateNickname('가'.repeat(20))).toEqual([]);
  });

  it('닉네임이 21자면 profile 검증에 실패한다', async () => {
    expect(await validateNickname('가'.repeat(21))).toEqual(['profile']);
  });
});
