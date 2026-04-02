import assert from 'node:assert/strict';

import test from 'node:test';

import type { BandsRepository } from './repositories/bands.repository';
import { BandsController } from './bands.controller';
import { BandsService } from './bands.service';

function createBandsRepositoryStub(): BandsRepository {
  return {
    async createBand(input) {
      return {
        band: {
          id: 'band-created-001',
          name: input.name,
          description: input.description,
          visibility: input.visibility,
          inviteCode: '7KQ2M9',
          bmId: '11111111-1111-1111-1111-111111111111',
          createdAt: '2026-03-03T09:20:10.123Z',
          updatedAt: '2026-03-03T09:20:10.123Z',
        },
      };
    },
  };
}

test('밴드 생성 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
  const repository = createBandsRepositoryStub();
  const service = new BandsService(repository);
  const controller = new BandsController(service);

  const response = await controller.createBand({
    name: '합주하자',
    description: '주 1회 합주하는 밴드입니다.',
    visibility: true,
  });

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '밴드 생성 성공');
  assert.equal(response.data.band.id, 'band-created-001');
  assert.equal(response.data.band.inviteCode, '7KQ2M9');
});
