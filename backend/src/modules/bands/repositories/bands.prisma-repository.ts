import { randomInt } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { CreateBandInput } from '../dto/create-band.dto';
import type { CreateBandResult } from '../types/create-band-result.type';

import type { BandsRepository } from './bands.repository';

const DEMO_VIEWER_USER_ID = '11111111-1111-1111-1111-111111111111';
const INVITE_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 6;
const MAX_INVITE_CODE_RETRY_COUNT = 10;

/**
 * 인증이 아직 붙지 않은 단계에서는 시드에 넣어 둔 데모 사용자를
 * 밴드 생성 주체이자 BM 사용자로 사용한다.
 */
@Injectable()
export class BandsPrismaRepository implements BandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 새 밴드를 만들고, 생성자를 BM 멤버로 함께 등록한다.
   *
   * @param {CreateBandInput} input - 검증이 끝난 밴드 생성 입력값
   * @returns {Promise<CreateBandResult>} 밴드 생성 응답 데이터
   */
  async createBand(input: CreateBandInput): Promise<CreateBandResult> {
    const inviteCode = await this.generateUniqueInviteCode();

    const createdBand = await this.prisma.$transaction(async transaction => {
      const band = await transaction.band.create({
        data: {
          name: input.name,
          description: input.description,
          visibility: input.visibility,
          inviteCode,
          bandMasterUserId: DEMO_VIEWER_USER_ID,
        },
      });

      await transaction.bandMember.create({
        data: {
          bandId: band.id,
          userId: DEMO_VIEWER_USER_ID,
          role: 'BM',
        },
      });

      return band;
    });

    return {
      band: {
        id: createdBand.id,
        name: createdBand.name ?? '',
        description: createdBand.description ?? '',
        visibility: createdBand.visibility ?? true,
        inviteCode: createdBand.inviteCode ?? inviteCode,
        bmId: createdBand.bandMasterUserId,
        createdAt: createdBand.createdAt.toISOString(),
        updatedAt: createdBand.updatedAt.toISOString(),
      },
    };
  }

  /**
   * 초대 코드는 사람이 읽기 쉬운 6자리 영숫자로 만들고,
   * 이미 사용 중인 코드면 다시 생성한다.
   *
   * @returns {Promise<string>} 중복이 아닌 초대 코드
   */
  private async generateUniqueInviteCode(): Promise<string> {
    for (let retryCount = 0; retryCount < MAX_INVITE_CODE_RETRY_COUNT; retryCount += 1) {
      const inviteCode = this.createInviteCode();
      const existingBand = await this.prisma.band.findFirst({
        where: {
          inviteCode,
        },
        select: {
          id: true,
        },
      });

      if (existingBand === null) {
        return inviteCode;
      }
    }

    throw new Error('사용 가능한 초대 코드를 생성하지 못했습니다.');
  }

  /**
   * 헷갈리기 쉬운 문자를 제외한 6자리 초대 코드를 만든다.
   *
   * @returns {string} 새 초대 코드 문자열
   */
  private createInviteCode(): string {
    let inviteCode = '';

    for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
      const randomCharacterIndex = randomInt(0, INVITE_CODE_CHARACTERS.length);
      inviteCode += INVITE_CODE_CHARACTERS[randomCharacterIndex];
    }

    return inviteCode;
  }
}
