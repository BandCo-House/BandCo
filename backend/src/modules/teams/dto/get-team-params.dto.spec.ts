import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { GetTeamParamsDto } from './get-team-params.dto';

describe('GetTeamParamsDto', () => {
  it.each(['*', '**', 'undefined', ':teamId', 'not-a-uuid', ''])('UUID 형식이 아닌 teamId(%s)는 거부한다', async teamId => {
    const errors = await validate(plainToInstance(GetTeamParamsDto, { teamId }));

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('teamId');
    expect(errors[0].constraints).toEqual({ isUuid: 'teamId은(는) 유효한 uuid이어야 합니다.' });
  });

  it.each(['550e8400-e29b-41d4-a716-446655440000', '370ce3f7-0e72-5ab0-a3c4-72e4887ac75a'])('유효한 UUID(%s)는 통과시킨다', async teamId => {
    const errors = await validate(plainToInstance(GetTeamParamsDto, { teamId }));

    expect(errors).toHaveLength(0);
  });

  it('경로 검증에서 잘못된 ID를 400 예외로 처리한다', async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

    await expect(pipe.transform({ teamId: '*' }, { type: 'param', metatype: GetTeamParamsDto })).rejects.toThrow(BadRequestException);
  });
});
