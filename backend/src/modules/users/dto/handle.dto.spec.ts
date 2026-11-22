import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ChangeHandleDto } from './change-handle.dto';
import { CheckHandleQueryDto } from './check-handle-query.dto';

const dtoClasses = [ChangeHandleDto, CheckHandleQueryDto];

describe.each(dtoClasses)('%p 고유 ID 형식', dtoClass => {
  async function isValid(handle: unknown): Promise<boolean> {
    const errors = await validate(plainToInstance(dtoClass, { handle }));
    return errors.length === 0;
  }

  it.each(['dev_', 'devjun', 'Dev_Jun1', '12345678'])('%p는 통과한다', async handle => {
    expect(await isValid(handle)).toBe(true);
  });

  it.each(['dev', 'devjun123', '데브준', 'dev-jun', 'dev jun', '', 1234])('%p는 실패한다', async handle => {
    expect(await isValid(handle)).toBe(false);
  });
});
