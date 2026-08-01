import { createHash, randomInt } from 'node:crypto';

import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import { BandMemberRole, type Prisma } from '../../generated/prisma';

import { BAND_INVITE_LINKS_REPOSITORY, type BandInviteLinksRepository } from './repositories/band-invite-links.repository';
import type { CreateBandInviteLinkResult, JoinBandByInviteLinkResult, RevokeBandInviteLinkResult } from './types/band-invite-link.type';

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 16;
const INVITE_LINK_EXPIRATION_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class BandInviteLinksService {
  constructor(
    @Inject(BAND_INVITE_LINKS_REPOSITORY)
    private readonly bandInviteLinksRepository: BandInviteLinksRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 밴드 운영자만 기존 코드를 무효화하며 7일짜리 초대 코드를 발급할 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} bandId - 링크를 발급할 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateBandInviteLinkResult>} 새 원본 코드와 만료 시각
   */
  async createBandInviteLink(requesterUserId: string, bandId: string, tx?: Prisma.TransactionClient): Promise<CreateBandInviteLinkResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateBandInviteLinkResult> => {
      const manager = await this.findBandInviteLinkManager(bandId, requesterUserId, client);
      const inviteCode = this.createInviteCode();
      const codeHash = this.createCodeHash(inviteCode);
      const expiredAt = new Date(Date.now() + INVITE_LINK_EXPIRATION_DAYS * MILLISECONDS_PER_DAY);

      const inviteLink = await this.bandInviteLinksRepository.upsertBandInviteLink(
        {
          bandId,
          createBandMemberId: manager.id,
          codeHash,
          expiredAt,
        },
        client,
      );

      return {
        bandId: inviteLink.bandId,
        inviteCode,
        expiredAt: inviteLink.expiredAt.toISOString(),
      };
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드 운영자만 현재 초대 링크를 즉시 폐기할 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} bandId - 링크를 폐기할 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<RevokeBandInviteLinkResult>} 폐기한 밴드와 처리 시각
   */
  async revokeBandInviteLink(requesterUserId: string, bandId: string, tx?: Prisma.TransactionClient): Promise<RevokeBandInviteLinkResult> {
    const run = async (client: Prisma.TransactionClient): Promise<RevokeBandInviteLinkResult> => {
      await this.findBandInviteLinkManager(bandId, requesterUserId, client);

      const revoked = await this.bandInviteLinksRepository.deleteBandInviteLinkByBandId(bandId, client);

      if (!revoked) {
        throw new NotFoundException('폐기할 밴드 초대 링크를 찾을 수 없습니다.');
      }

      return {
        bandId,
        revokedAt: new Date().toISOString(),
      };
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 인증 사용자가 유효한 코드로 차단 여부를 검증받고 일반 멤버로 즉시 가입한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} code - 사용자가 입력하거나 링크에서 전달한 원본 코드
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<JoinBandByInviteLinkResult>} 링크 가입 결과
   */
  async joinBandByInviteLink(userId: string, code: string, tx?: Prisma.TransactionClient): Promise<JoinBandByInviteLinkResult> {
    const run = async (client: Prisma.TransactionClient): Promise<JoinBandByInviteLinkResult> => {
      const normalizedCode = code.trim().toUpperCase();
      const codeHash = this.createCodeHash(normalizedCode);
      const inviteLink = await this.bandInviteLinksRepository.findBandInviteLinkByCodeHash(codeHash, client);

      if (inviteLink === null || inviteLink.expiredAt === null || inviteLink.expiredAt.getTime() <= Date.now()) {
        throw new NotFoundException('유효한 밴드 초대 링크를 찾을 수 없습니다.');
      }

      const existingMember = await this.bandInviteLinksRepository.findBandMemberByBandIdAndUserId(inviteLink.bandId, userId, client);

      if (existingMember !== null) {
        throw new ConflictException('이미 밴드 멤버인 사용자입니다.');
      }

      const blacklist = await this.bandInviteLinksRepository.findBandBlacklistByBandIdAndUserId(inviteLink.bandId, userId, client);

      if (blacklist !== null) {
        throw new ForbiddenException('밴드에서 차단된 사용자는 초대 링크로 가입할 수 없습니다.');
      }

      const member = await this.bandInviteLinksRepository.createBandMember(inviteLink.bandId, userId, client);
      await this.bandInviteLinksRepository.deletePendingBandEntryRequests(inviteLink.bandId, userId, client);

      return {
        bandId: inviteLink.bandId,
        userId,
        memberId: member.id,
        joinedAt: member.joinedAt.toISOString(),
      };
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  private async findBandInviteLinkManager(
    bandId: string,
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{
    id: string;
  }> {
    const band = await this.bandInviteLinksRepository.findActiveBandWithRequesterMember(bandId, userId, tx);

    if (band === null) {
      throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
    }

    if (band.member === null) {
      throw new ForbiddenException('밴드 초대 링크 관리 권한이 없습니다.');
    }

    const canManageInviteLink = band.member.role === BandMemberRole.BM || band.member.role === BandMemberRole.ADMIN;

    if (!canManageInviteLink) {
      throw new ForbiddenException('밴드 초대 링크 관리 권한이 없습니다.');
    }

    return band.member;
  }

  private createInviteCode(): string {
    let inviteCode = '';

    for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
      const alphabetIndex = randomInt(INVITE_CODE_ALPHABET.length);
      inviteCode += INVITE_CODE_ALPHABET[alphabetIndex];
    }

    return inviteCode;
  }

  private createCodeHash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
