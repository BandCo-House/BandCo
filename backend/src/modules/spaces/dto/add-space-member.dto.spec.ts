import assert from 'node:assert/strict';

import { BadRequestException } from '@nestjs/common';
import test from 'node:test';

import { parseAddSpaceMemberBody } from './add-space-member.dto';

test('합주 공간 멤버 추가 본문 파서는 userId와 role을 정리한다', () => {
  const result = parseAddSpaceMemberBody({
    userId: '22222222-2222-2222-2222-222222222222',
    role: 'LEADER',
  });

  assert.deepEqual(result, {
    userId: '22222222-2222-2222-2222-222222222222',
    role: 'LEADER',
  });
});

test('합주 공간 멤버 추가 본문 파서는 role이 없으면 MEMBER를 기본값으로 쓴다', () => {
  const result = parseAddSpaceMemberBody({
    userId: '22222222-2222-2222-2222-222222222222',
  });

  assert.deepEqual(result, {
    userId: '22222222-2222-2222-2222-222222222222',
    role: 'MEMBER',
  });
});

test('합주 공간 멤버 추가 본문 파서는 userId가 UUID가 아니면 예외를 던진다', () => {
  assert.throws(() => {
    parseAddSpaceMemberBody({
      userId: 'user-001',
    });
  }, BadRequestException);
});
