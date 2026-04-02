import assert from 'node:assert/strict';

import { BadRequestException } from '@nestjs/common';
import test from 'node:test';

import { parseCreateBandSpaceBody } from './create-band-space.dto';

test('합주 공간 생성 본문 파서는 유효한 입력을 그대로 정리한다', () => {
  const result = parseCreateBandSpaceBody({
    name: '3월 정기 합주',
    description: '정기 합주 준비',
    spaceType: 'STUDIO',
    status: 'ACTIVE',
    startDate: '2026-03-01',
    endDate: '2026-03-20',
  });

  assert.deepEqual(result, {
    name: '3월 정기 합주',
    description: '정기 합주 준비',
    spaceType: 'STUDIO',
    status: 'ACTIVE',
    startDate: '2026-03-01',
    endDate: '2026-03-20',
  });
});

test('합주 공간 생성 본문 파서는 시작일이 종료일보다 늦으면 예외를 던진다', () => {
  assert.throws(() => {
    parseCreateBandSpaceBody({
      name: '3월 정기 합주',
      description: '정기 합주 준비',
      spaceType: 'STUDIO',
      status: 'ACTIVE',
      startDate: '2026-03-21',
      endDate: '2026-03-20',
    });
  }, BadRequestException);
});

test('합주 공간 생성 본문 파서는 허용되지 않은 공간 타입이면 예외를 던진다', () => {
  assert.throws(() => {
    parseCreateBandSpaceBody({
      name: '3월 정기 합주',
      description: '정기 합주 준비',
      spaceType: 'CONCERT',
      status: 'ACTIVE',
      startDate: '2026-03-01',
      endDate: '2026-03-20',
    });
  }, BadRequestException);
});
