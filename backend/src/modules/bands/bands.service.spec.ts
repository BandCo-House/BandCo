import assert from 'node:assert/strict';

import { BadRequestException } from '@nestjs/common';
import test from 'node:test';

import type { PrismaService } from '../../database/prisma';

import type { BandsRepository, CreateBandRepositoryInput } from './repositories/bands.repository';
import { BandsService } from './bands.service';

const BAND_MASTER_USER_ID = '11111111-1111-4111-8111-111111111111';
const ROCK_GENRE_ID = '22222222-2222-4222-8222-222222222222';
const JAZZ_GENRE_ID = '33333333-3333-4333-8333-333333333333';
const INVITEE_USER_ID = '44444444-4444-4444-8444-444444444444';
const MISSING_USER_ID = '55555555-5555-4555-8555-555555555555';

function createBandsRepositoryStub(options?: {
  existingGenreIds?: string[];
  existingUserIds?: string[];
  onCreateBand?: (input: CreateBandRepositoryInput, tx: unknown) => void;
  onFindExistingGenreIds?: (tx: unknown) => void;
  onFindExistingUserIds?: (tx: unknown) => void;
}): BandsRepository {
  return {
    async createBand(input, tx) {
      options?.onCreateBand?.(input, tx);

      return {
        band: {
          id: 'band-001',
          name: input.name,
          description: input.description ?? null,
          visibility: input.visibility,
          coverImgUrl: input.coverImgUrl ?? null,
          genres: input.genreIds.map(genreId => ({
            id: genreId,
            name: genreId === ROCK_GENRE_ID ? 'rock' : 'jazz',
          })),
          bandMasterUserId: input.bandMasterUserId,
          createdAt: '2026-03-03T09:20:10.123Z',
          invitations: {
            success: input.inviteeUserIds.map(userId => ({
              userId,
              invitationId: `invitation-${userId}`,
            })),
            failed: [],
          },
        },
      };
    },
    async findExistingGenreIds(genreIds, tx) {
      options?.onFindExistingGenreIds?.(tx);

      return options?.existingGenreIds ?? genreIds;
    },
    async findExistingUserIds(userIds, tx) {
      options?.onFindExistingUserIds?.(tx);

      return options?.existingUserIds ?? userIds;
    },
  };
}

function createPrismaServiceStub(): PrismaService {
  const tx = {
    transactionClient: true,
  };

  return {
    async $transaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(tx);
    },
  } as PrismaService;
}

function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

test('밴드 생성 서비스는 인증 사용자를 밴드장으로 사용하고 생성 결과를 반환한다', async () => {
  let capturedInput: CreateBandRepositoryInput | undefined;
  const repository = createBandsRepositoryStub({
    onCreateBand(input) {
      capturedInput = input;
    },
  });
  const service = new BandsService(repository, createPrismaServiceStub());

  const result = await service.createBand(BAND_MASTER_USER_ID, {
    name: '합주하자',
    description: '주 1회 합주하는 밴드입니다.',
    visibility: true,
    coverImgUrl: 'https://cdn.example.com/bands/cover.png',
    genreIds: [ROCK_GENRE_ID, ROCK_GENRE_ID, JAZZ_GENRE_ID],
    inviteeUserIds: [INVITEE_USER_ID, INVITEE_USER_ID],
  });

  assert.equal(capturedInput?.bandMasterUserId, BAND_MASTER_USER_ID);
  assert.deepEqual(capturedInput?.genreIds, [ROCK_GENRE_ID, JAZZ_GENRE_ID]);
  assert.deepEqual(capturedInput?.inviteeUserIds, [INVITEE_USER_ID]);
  assert.equal(result.band.name, '합주하자');
  assert.equal(result.band.genres.length, 2);
  assert.equal(result.band.invitations.success.length, 1);
  assert.equal(result.band.invitations.failed.length, 0);
});

test('밴드 생성 서비스는 존재하지 않는 장르가 있으면 예외를 던진다', async () => {
  const repository = createBandsRepositoryStub({
    existingGenreIds: [ROCK_GENRE_ID],
  });
  const service = new BandsService(repository, createPrismaServiceStub());

  await assert.rejects(
    async () =>
      service.createBand(BAND_MASTER_USER_ID, {
        name: '합주하자',
        visibility: true,
        genreIds: [ROCK_GENRE_ID, JAZZ_GENRE_ID],
      }),
    BadRequestException,
  );
});

test('밴드 생성 서비스는 초대할 수 없는 사용자를 실패 목록으로 분리한다', async () => {
  const repository = createBandsRepositoryStub({
    existingUserIds: [INVITEE_USER_ID],
  });
  const service = new BandsService(repository, createPrismaServiceStub());

  const result = await service.createBand(BAND_MASTER_USER_ID, {
    name: '합주하자',
    visibility: true,
    inviteeUserIds: [INVITEE_USER_ID, BAND_MASTER_USER_ID, MISSING_USER_ID],
  });

  assert.deepEqual(result.band.invitations.success, [
    {
      userId: INVITEE_USER_ID,
      invitationId: `invitation-${INVITEE_USER_ID}`,
    },
  ]);
  assert.deepEqual(result.band.invitations.failed, [
    {
      userId: BAND_MASTER_USER_ID,
      reason: '밴드 생성자는 초대 대상이 될 수 없습니다.',
    },
    {
      userId: MISSING_USER_ID,
      reason: '존재하지 않거나 비활성화된 사용자입니다.',
    },
  ]);
});

test('밴드 생성 서비스는 검증과 생성을 같은 transaction client로 실행한다', async () => {
  const capturedTransactions: unknown[] = [];
  const repository = createBandsRepositoryStub({
    onFindExistingGenreIds(tx) {
      capturedTransactions.push(tx);
    },
    onFindExistingUserIds(tx) {
      capturedTransactions.push(tx);
    },
    onCreateBand(_input, tx) {
      capturedTransactions.push(tx);
    },
  });
  const service = new BandsService(repository, createPrismaServiceStub());

  await service.createBand(BAND_MASTER_USER_ID, {
    name: '합주하자',
    visibility: true,
    genreIds: [ROCK_GENRE_ID],
    inviteeUserIds: [INVITEE_USER_ID],
  });

  assert.equal(capturedTransactions.length, 3);
  assert.equal(capturedTransactions[0], capturedTransactions[1]);
  assert.equal(capturedTransactions[1], capturedTransactions[2]);
});

test('밴드 생성 서비스는 외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
  const externalTx = {
    transactionClient: true,
  };
  const capturedTransactions: unknown[] = [];
  const repository = createBandsRepositoryStub({
    onFindExistingGenreIds(tx) {
      capturedTransactions.push(tx);
    },
    onFindExistingUserIds(tx) {
      capturedTransactions.push(tx);
    },
    onCreateBand(_input, tx) {
      capturedTransactions.push(tx);
    },
  });
  const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

  await service.createBand(
    BAND_MASTER_USER_ID,
    {
      name: '합주하자',
      visibility: true,
      genreIds: [ROCK_GENRE_ID],
      inviteeUserIds: [INVITEE_USER_ID],
    },
    externalTx as never,
  );

  assert.equal(capturedTransactions.length, 3);
  assert.equal(capturedTransactions[0], externalTx);
  assert.equal(capturedTransactions[1], externalTx);
  assert.equal(capturedTransactions[2], externalTx);
});
