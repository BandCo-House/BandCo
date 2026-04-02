import assert from 'node:assert/strict';

import { BadRequestException } from '@nestjs/common';
import test from 'node:test';

import { parseCreateBandBody } from './create-band.dto';

test('밴드 생성 본문 파서는 유효한 입력을 그대로 정리한다', () => {
  const result = parseCreateBandBody({
    name: '합주하자',
    description: '주 1회 합주하는 밴드입니다.',
    visibility: true,
  });

  assert.deepEqual(result, {
    name: '합주하자',
    description: '주 1회 합주하는 밴드입니다.',
    visibility: true,
  });
});

test('밴드 생성 본문 파서는 이름이 비어 있으면 예외를 던진다', () => {
  assert.throws(() => {
    parseCreateBandBody({
      name: '   ',
      description: '설명',
      visibility: true,
    });
  }, BadRequestException);
});

test('밴드 생성 본문 파서는 visibility가 boolean이 아니면 예외를 던진다', () => {
  assert.throws(() => {
    parseCreateBandBody({
      name: '합주하자',
      description: '설명',
      visibility: 'true',
    });
  }, BadRequestException);
});
