import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import { BandMemberRole, type Prisma } from '../../generated/prisma';

import type { CreateBandInput } from './dto/create-band.dto';
import type { CreateBandInvitationInput } from './dto/create-band-invitation.dto';
import type { CreateBandJoinRequestInput } from './dto/create-band-join-request.dto';
import type { GetBandJoinRequestsQuery } from './dto/get-band-join-requests-query.dto';
import type { GetBandMembersQuery } from './dto/get-band-members-query.dto';
import type { GetMyBandsQuery } from './dto/get-my-bands-query.dto';
import type { GetReceivedBandInvitationsQuery } from './dto/get-received-band-invitations-query.dto';
import type { GetSentBandInvitationsQuery } from './dto/get-sent-band-invitations-query.dto';
import type { GetSentBandJoinRequestsQuery } from './dto/get-sent-band-join-requests-query.dto';
import type { SearchBandsQuery } from './dto/search-bands-query.dto';
import type { UpdateBandInput } from './dto/update-band.dto';
import type { UpdateBandMemberRoleInput } from './dto/update-band-member-role.dto';
import { BANDS_REPOSITORY, type BandsRepository } from './repositories/bands.repository';
import type { AcceptBandInvitationResult } from './types/accept-band-invitation-result.type';
import type { ApproveBandJoinRequestResult } from './types/approve-band-join-request-result.type';
import type { GetBandJoinRequestsResult } from './types/band-join-request-list.type';
import type { GetBandMembersResult } from './types/band-member-list.type';
import type { SearchBandsResult } from './types/band-search-result.type';
import type { CreateBandInvitationResult } from './types/create-band-invitation-result.type';
import type { CreateBandJoinRequestResult } from './types/create-band-join-request-result.type';
import type { CreateBandInvitationFailedItem, CreateBandResult } from './types/create-band-result.type';
import type { DeclineBandInvitationResult } from './types/decline-band-invitation-result.type';
import type { DeleteBandInvitationResult } from './types/delete-band-invitation-result.type';
import type { DeleteBandResult } from './types/delete-band-result.type';
import type { LeaveBandResult } from './types/leave-band-result.type';
import type { GetMyBandsResult } from './types/my-band-list.type';
import type { GetReceivedBandInvitationsResult } from './types/received-band-invitation-list.type';
import type { RejectBandJoinRequestResult } from './types/reject-band-join-request-result.type';
import type { GetSentBandInvitationsResult } from './types/sent-band-invitation-list.type';
import type { GetSentBandJoinRequestsResult } from './types/sent-band-join-request-list.type';
import type { UpdateBandMemberRoleResult } from './types/update-band-member-role-result.type';
import type { UpdateBandResult } from './types/update-band-result.type';

@Injectable()
export class BandsService {
  constructor(
    @Inject(BANDS_REPOSITORY) private readonly bandsRepository: BandsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 인증 사용자를 밴드장으로 삼아 밴드 생성 정책을 검증하고 저장을 위임한다.
   *
   * @param {string} bandMasterUserId - 인증된 사용자 ID
   * @param {CreateBandInput} input - 검증이 끝난 밴드 생성 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateBandResult>} 밴드 생성 응답 데이터
   */
  async createBand(bandMasterUserId: string, input: CreateBandInput, tx?: Prisma.TransactionClient): Promise<CreateBandResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateBandResult> => {
      const genreIds = input.genreIds ?? [];
      this.validateDuplicatedIds(genreIds, '중복된 장르가 포함되어 있습니다.');
      await this.validateGenres(genreIds, client);

      const inviteeUserIds = input.inviteeUserIds ?? [];
      this.validateDuplicatedIds(inviteeUserIds, '중복된 초대 대상이 포함되어 있습니다.');
      const invitationTarget = await this.createInvitationTarget(bandMasterUserId, inviteeUserIds, client);

      const result = await this.bandsRepository.createBand(
        {
          ...input,
          bandMasterUserId,
          genreIds,
          inviteeUserIds: invitationTarget.validUserIds,
        },
        client,
      );

      return {
        band: {
          ...result.band,
          invitations: {
            success: result.band.invitations.success,
            failed: invitationTarget.failedItems,
          },
        },
      };
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드 운영 권한이 있는 멤버만 아직 가입하지 않은 활성 사용자에게 초대를 보낼 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} bandId - 초대를 보낼 밴드 ID
   * @param {CreateBandInvitationInput} input - 검증이 끝난 초대 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateBandInvitationResult>} 생성된 초대 정보
   */
  async createBandInvitation(
    requesterUserId: string,
    bandId: string,
    input: CreateBandInvitationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateBandInvitationResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateBandInvitationResult> => {
      if (requesterUserId === input.inviteeUserId) {
        throw new BadRequestException('자기 자신에게 밴드 초대를 보낼 수 없습니다.');
      }

      const band = await this.bandsRepository.findActiveBandById(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      const requesterMember = await this.bandsRepository.findBandMemberByBandIdAndUserId(bandId, requesterUserId, client);

      if (requesterMember === null) {
        throw new ForbiddenException('밴드 초대 권한이 없습니다.');
      }

      const canInvite = requesterMember.role === BandMemberRole.BM || requesterMember.role === BandMemberRole.ADMIN;

      if (!canInvite) {
        throw new ForbiddenException('밴드 초대 권한이 없습니다.');
      }

      const existingInviteeUserIds = await this.bandsRepository.findExistingUserIds([input.inviteeUserId], client);

      if (existingInviteeUserIds.length === 0) {
        throw new BadRequestException('존재하지 않거나 비활성화된 사용자입니다.');
      }

      const inviteeMember = await this.bandsRepository.findBandMemberByBandIdAndUserId(bandId, input.inviteeUserId, client);

      if (inviteeMember !== null) {
        throw new ConflictException('이미 밴드 멤버인 사용자입니다.');
      }

      const blacklist = await this.bandsRepository.findBandBlacklistByBandIdAndUserId(bandId, input.inviteeUserId, client);

      if (blacklist !== null) {
        throw new ForbiddenException('밴드에서 차단된 사용자는 초대할 수 없습니다.');
      }

      const existingInvitation = await this.bandsRepository.findBandInvitationByBandIdAndInviteeUserId(bandId, input.inviteeUserId, client);

      if (existingInvitation !== null) {
        throw new ConflictException('이미 밴드 초대가 존재합니다.');
      }

      return this.bandsRepository.createBandInvitation(
        {
          ...input,
          bandId,
          inviterBandMemberId: requesterMember.id,
        },
        client,
      );
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 인증 사용자는 공개 밴드에만 가입 요청을 보낼 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 가입 요청을 보낼 밴드 ID
   * @param {CreateBandJoinRequestInput} input - 검증이 끝난 가입 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateBandJoinRequestResult>} 생성된 가입 요청 정보
   */
  async createBandJoinRequest(
    userId: string,
    bandId: string,
    input: CreateBandJoinRequestInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateBandJoinRequestResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateBandJoinRequestResult> => {
      const band = await this.bandsRepository.findBandForJoinRequest(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      if (!band.visibility) {
        throw new ForbiddenException('비공개 밴드에는 가입 요청을 보낼 수 없습니다.');
      }

      const member = await this.bandsRepository.findBandMemberByBandIdAndUserId(bandId, userId, client);

      if (member !== null) {
        throw new ConflictException('이미 밴드 멤버인 사용자입니다.');
      }

      const blacklist = await this.bandsRepository.findBandBlacklistByBandIdAndUserId(bandId, userId, client);

      if (blacklist !== null) {
        throw new ForbiddenException('밴드에서 차단된 사용자는 가입 요청을 보낼 수 없습니다.');
      }

      const existingInvitation = await this.bandsRepository.findBandInvitationByBandIdAndInviteeUserId(bandId, userId, client);

      if (existingInvitation !== null) {
        throw new ConflictException('이미 밴드 초대가 존재합니다.');
      }

      const existingJoinRequest = await this.bandsRepository.findBandJoinRequestByBandIdAndUserId(bandId, userId, client);

      if (existingJoinRequest !== null) {
        throw new ConflictException('이미 밴드 가입 요청이 존재합니다.');
      }

      return this.bandsRepository.createBandJoinRequest(
        {
          ...input,
          bandId,
          userId,
        },
        client,
      );
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 인증 사용자가 받은 초대를 상태 필터와 커서 기준으로 조회한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {GetReceivedBandInvitationsQuery} query - 상태 필터와 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetReceivedBandInvitationsResult>} 받은 초대 목록
   */
  async getReceivedBandInvitations(
    userId: string,
    query: GetReceivedBandInvitationsQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetReceivedBandInvitationsResult> {
    return this.bandsRepository.findReceivedBandInvitations(userId, query, tx);
  }

  /**
   * 인증 사용자가 직접 보낸 초대를 상태 필터와 커서 기준으로 조회한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {GetSentBandInvitationsQuery} query - 상태 필터와 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetSentBandInvitationsResult>} 보낸 초대 목록
   */
  async getSentBandInvitations(
    userId: string,
    query: GetSentBandInvitationsQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetSentBandInvitationsResult> {
    return this.bandsRepository.findSentBandInvitations(userId, query, tx);
  }

  /**
   * 인증 사용자가 직접 보낸 가입 요청을 상태 필터와 커서 기준으로 조회한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {GetSentBandJoinRequestsQuery} query - 상태 필터와 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetSentBandJoinRequestsResult>} 보낸 가입 요청 목록
   */
  async getSentBandJoinRequests(
    userId: string,
    query: GetSentBandJoinRequestsQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetSentBandJoinRequestsResult> {
    return this.bandsRepository.findSentBandJoinRequests(userId, query, tx);
  }

  /**
   * 밴드 운영 권한이 있는 멤버만 밴드로 들어온 가입 요청을 조회할 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} bandId - 가입 요청을 조회할 밴드 ID
   * @param {GetBandJoinRequestsQuery} query - 상태 필터와 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandJoinRequestsResult>} 밴드 가입 요청 목록
   */
  async getBandJoinRequests(
    requesterUserId: string,
    bandId: string,
    query: GetBandJoinRequestsQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandJoinRequestsResult> {
    const run = async (client: Prisma.TransactionClient): Promise<GetBandJoinRequestsResult> => {
      const band = await this.bandsRepository.findActiveBandById(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      await this.validateBandJoinRequestManager(bandId, requesterUserId, client);

      return this.bandsRepository.findBandJoinRequests(bandId, query, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드 운영 권한이 있는 멤버만 대기 중인 가입 요청을 승인하고 일반 멤버로 가입시킬 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} joinRequestId - 승인할 가입 요청 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ApproveBandJoinRequestResult>} 가입 요청 승인 결과
   */
  async approveBandJoinRequest(requesterUserId: string, joinRequestId: string, tx?: Prisma.TransactionClient): Promise<ApproveBandJoinRequestResult> {
    const run = async (client: Prisma.TransactionClient): Promise<ApproveBandJoinRequestResult> => {
      const joinRequest = await this.bandsRepository.findBandJoinRequestForResponse(joinRequestId, client);

      if (joinRequest === null) {
        throw new NotFoundException('요청한 밴드 가입 요청을 찾을 수 없습니다.');
      }

      await this.validateBandJoinRequestManager(joinRequest.bandId, requesterUserId, client);

      if (joinRequest.status !== 'PENDING') {
        throw new ConflictException('대기 중인 밴드 가입 요청만 승인할 수 있습니다.');
      }

      const existingMember = await this.bandsRepository.findBandMemberByBandIdAndUserId(joinRequest.bandId, joinRequest.userId, client);

      if (existingMember !== null) {
        throw new ConflictException('이미 밴드 멤버인 사용자입니다.');
      }

      const blacklist = await this.bandsRepository.findBandBlacklistByBandIdAndUserId(joinRequest.bandId, joinRequest.userId, client);

      if (blacklist !== null) {
        throw new ForbiddenException('밴드에서 차단된 사용자는 가입 요청을 승인할 수 없습니다.');
      }

      return this.bandsRepository.approveBandJoinRequest(joinRequest.id, joinRequest.bandId, joinRequest.userId, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드 운영 권한이 있는 멤버만 대기 중인 가입 요청을 거절할 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} joinRequestId - 거절할 가입 요청 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<RejectBandJoinRequestResult>} 가입 요청 거절 결과
   */
  async rejectBandJoinRequest(requesterUserId: string, joinRequestId: string, tx?: Prisma.TransactionClient): Promise<RejectBandJoinRequestResult> {
    const run = async (client: Prisma.TransactionClient): Promise<RejectBandJoinRequestResult> => {
      const joinRequest = await this.bandsRepository.findBandJoinRequestForResponse(joinRequestId, client);

      if (joinRequest === null) {
        throw new NotFoundException('요청한 밴드 가입 요청을 찾을 수 없습니다.');
      }

      await this.validateBandJoinRequestManager(joinRequest.bandId, requesterUserId, client);

      if (joinRequest.status !== 'PENDING') {
        throw new ConflictException('대기 중인 밴드 가입 요청만 거절할 수 있습니다.');
      }

      return this.bandsRepository.rejectBandJoinRequest(joinRequest.id, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 초대받은 사용자만 대기 중인 초대를 수락하고 일반 멤버로 가입할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} invitationId - 수락할 초대 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AcceptBandInvitationResult>} 초대 수락 결과
   */
  async acceptBandInvitation(userId: string, invitationId: string, tx?: Prisma.TransactionClient): Promise<AcceptBandInvitationResult> {
    const run = async (client: Prisma.TransactionClient): Promise<AcceptBandInvitationResult> => {
      const invitation = await this.bandsRepository.findBandInvitationForResponse(invitationId, client);

      if (invitation === null) {
        throw new NotFoundException('요청한 밴드 초대를 찾을 수 없습니다.');
      }

      if (invitation.inviteeUserId !== userId) {
        throw new ForbiddenException('밴드 초대 수락 권한이 없습니다.');
      }

      if (invitation.status !== 'PENDING') {
        throw new ConflictException('대기 중인 밴드 초대만 수락할 수 있습니다.');
      }

      const existingMember = await this.bandsRepository.findBandMemberByBandIdAndUserId(invitation.bandId, userId, client);

      if (existingMember !== null) {
        throw new ConflictException('이미 밴드 멤버인 사용자입니다.');
      }

      return this.bandsRepository.acceptBandInvitation(invitation.id, invitation.bandId, userId, new Date(), client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 초대받은 사용자만 대기 중인 초대를 거절할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} invitationId - 거절할 초대 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeclineBandInvitationResult>} 초대 거절 결과
   */
  async declineBandInvitation(userId: string, invitationId: string, tx?: Prisma.TransactionClient): Promise<DeclineBandInvitationResult> {
    const run = async (client: Prisma.TransactionClient): Promise<DeclineBandInvitationResult> => {
      const invitation = await this.bandsRepository.findBandInvitationForResponse(invitationId, client);

      if (invitation === null) {
        throw new NotFoundException('요청한 밴드 초대를 찾을 수 없습니다.');
      }

      if (invitation.inviteeUserId !== userId) {
        throw new ForbiddenException('밴드 초대 거절 권한이 없습니다.');
      }

      if (invitation.status !== 'PENDING') {
        throw new ConflictException('대기 중인 밴드 초대만 거절할 수 있습니다.');
      }

      return this.bandsRepository.declineBandInvitation(invitation.id, new Date(), client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 초대를 보낸 사용자만 대기 중인 초대를 취소할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} invitationId - 취소할 초대 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteBandInvitationResult>} 초대 취소 결과
   */
  async deleteBandInvitation(userId: string, invitationId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandInvitationResult> {
    const run = async (client: Prisma.TransactionClient): Promise<DeleteBandInvitationResult> => {
      const invitation = await this.bandsRepository.findBandInvitationForDelete(invitationId, client);

      if (invitation === null) {
        throw new NotFoundException('요청한 밴드 초대를 찾을 수 없습니다.');
      }

      if (invitation.inviterUserId !== userId) {
        throw new ForbiddenException('밴드 초대 취소 권한이 없습니다.');
      }

      if (invitation.status !== 'PENDING') {
        throw new ConflictException('대기 중인 밴드 초대만 취소할 수 있습니다.');
      }

      return this.bandsRepository.deleteBandInvitation(invitation.id, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드 하위 데이터를 보존하기 위해 deletedAt을 채워 삭제 상태로 표시한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 삭제할 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteBandResult>} 삭제 처리 결과
   */
  async deleteBand(userId: string, bandId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandResult> {
    const run = async (client: Prisma.TransactionClient): Promise<DeleteBandResult> => {
      const band = await this.bandsRepository.findActiveBandById(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      if (band.bandMasterUserId !== userId) {
        throw new ForbiddenException('밴드 삭제 권한이 없습니다.');
      }

      return this.bandsRepository.deleteBand(bandId, new Date(), client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드장은 위임 없이 나갈 수 없고, 일반 밴드 멤버만 자신의 멤버십을 삭제할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 나갈 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<LeaveBandResult>} 밴드 나가기 처리 결과
   */
  async leaveBand(userId: string, bandId: string, tx?: Prisma.TransactionClient): Promise<LeaveBandResult> {
    const run = async (client: Prisma.TransactionClient): Promise<LeaveBandResult> => {
      const band = await this.bandsRepository.findBandForLeave(bandId, userId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      if (band.member === null) {
        throw new ForbiddenException('밴드 멤버가 아닙니다.');
      }

      if (band.member.role === BandMemberRole.BM) {
        throw new ForbiddenException('밴드장은 이 API로 밴드를 나갈 수 없습니다.');
      }

      return this.bandsRepository.leaveBand(band.member.id, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 인증 사용자가 멤버로 속한 삭제되지 않은 밴드 목록을 조회한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {GetMyBandsQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetMyBandsResult>} 내가 속한 밴드 목록
   */
  async getMyBands(userId: string, query: GetMyBandsQuery, tx?: Prisma.TransactionClient): Promise<GetMyBandsResult> {
    this.validateCursorPair(query);

    return this.bandsRepository.findMyBands(userId, query, tx);
  }

  /**
   * MVP에서는 가입 전 미리보기를 위해 삭제되지 않은 밴드의 멤버 목록을 공개 조회한다.
   *
   * @param {string} bandId - 조회할 밴드 ID
   * @param {GetBandMembersQuery} query - 정렬과 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandMembersResult>} 밴드 멤버 목록
   */
  async getBandMembers(bandId: string, query: GetBandMembersQuery, tx?: Prisma.TransactionClient): Promise<GetBandMembersResult> {
    this.validateBandMemberListQuery(query);

    const band = await this.bandsRepository.findActiveBandById(bandId, tx);

    if (band === null) {
      throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
    }

    return this.bandsRepository.findBandMembers(bandId, query, tx);
  }

  /**
   * 공개 밴드 검색은 인증 없이 이름 기준으로만 조회한다.
   *
   * @param {SearchBandsQuery} query - 검색어, 정렬, 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SearchBandsResult>} 공개 밴드 검색 결과
   */
  async searchBands(query: SearchBandsQuery, tx?: Prisma.TransactionClient): Promise<SearchBandsResult> {
    this.validateBandSearchQuery(query);

    return this.bandsRepository.searchBands(query, tx);
  }

  /**
   * 밴드장만 밴드의 기본 정보를 수정할 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} bandId - 수정할 밴드 ID
   * @param {UpdateBandInput} input - 검증이 끝난 밴드 수정 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateBandResult>} 수정된 밴드 정보
   */
  async updateBand(requesterUserId: string, bandId: string, input: UpdateBandInput, tx?: Prisma.TransactionClient): Promise<UpdateBandResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateBandResult> => {
      this.validateUpdateBandInput(input);

      const band = await this.bandsRepository.findActiveBandById(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      if (band.bandMasterUserId !== requesterUserId) {
        throw new ForbiddenException('밴드 정보 수정 권한이 없습니다.');
      }

      return this.bandsRepository.updateBand(bandId, input, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드장은 부리더와 일반 멤버 간 역할만 변경할 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} bandId - 대상 밴드 ID
   * @param {string} targetUserId - 역할을 변경할 사용자 ID
   * @param {UpdateBandMemberRoleInput} input - 검증이 끝난 역할 변경 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateBandMemberRoleResult>} 변경된 밴드 멤버 권한
   */
  async updateBandMemberRole(
    requesterUserId: string,
    bandId: string,
    targetUserId: string,
    input: UpdateBandMemberRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateBandMemberRoleResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateBandMemberRoleResult> => {
      if (input.role === BandMemberRole.BM) {
        throw new BadRequestException('밴드장 권한은 이 API에서 부여할 수 없습니다.');
      }

      const band = await this.bandsRepository.findActiveBandById(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      if (band.bandMasterUserId !== requesterUserId) {
        throw new ForbiddenException('밴드 멤버 권한 변경 권한이 없습니다.');
      }

      if (targetUserId === band.bandMasterUserId) {
        throw new BadRequestException('밴드장 권한은 이 API에서 변경할 수 없습니다.');
      }

      const member = await this.bandsRepository.findBandMemberByBandIdAndUserId(bandId, targetUserId, client);

      if (member === null) {
        throw new NotFoundException('요청한 밴드 멤버를 찾을 수 없습니다.');
      }

      return this.bandsRepository.updateBandMemberRole(member.id, input, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  private async validateBandJoinRequestManager(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const member = await this.bandsRepository.findBandMemberByBandIdAndUserId(bandId, userId, tx);

    if (member === null) {
      throw new ForbiddenException('밴드 가입 요청 관리 권한이 없습니다.');
    }

    const canManageJoinRequest = member.role === BandMemberRole.BM || member.role === BandMemberRole.ADMIN;

    if (!canManageJoinRequest) {
      throw new ForbiddenException('밴드 가입 요청 관리 권한이 없습니다.');
    }
  }

  private async validateGenres(genreIds: string[], tx: Prisma.TransactionClient): Promise<void> {
    if (genreIds.length === 0) {
      return;
    }

    const existingGenreIds = await this.bandsRepository.findExistingGenreIds(genreIds, tx);

    if (existingGenreIds.length !== genreIds.length) {
      throw new BadRequestException('존재하지 않는 장르가 포함되어 있습니다.');
    }
  }

  private async createInvitationTarget(
    bandMasterUserId: string,
    inviteeUserIds: string[],
    tx: Prisma.TransactionClient,
  ): Promise<{
    validUserIds: string[];
    failedItems: CreateBandInvitationFailedItem[];
  }> {
    if (inviteeUserIds.length === 0) {
      return {
        validUserIds: [],
        failedItems: [],
      };
    }

    const selfInviteeUserIds = inviteeUserIds.filter(userId => userId === bandMasterUserId);
    const userIdsToFind = inviteeUserIds.filter(userId => userId !== bandMasterUserId);
    const existingUserIds = await this.bandsRepository.findExistingUserIds(userIdsToFind, tx);
    const existingUserIdSet = new Set(existingUserIds);
    const validUserIds = userIdsToFind.filter(userId => existingUserIdSet.has(userId));
    const missingUserIds = userIdsToFind.filter(userId => !existingUserIdSet.has(userId));

    return {
      validUserIds,
      failedItems: [
        ...selfInviteeUserIds.map(userId => ({
          userId,
          reason: '밴드 생성자는 초대 대상이 될 수 없습니다.',
        })),
        ...missingUserIds.map(userId => ({
          userId,
          reason: '존재하지 않거나 비활성화된 사용자입니다.',
        })),
      ],
    };
  }

  private validateDuplicatedIds(ids: string[], message: string): void {
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      throw new BadRequestException(message);
    }
  }

  private validateCursorPair(query: GetMyBandsQuery): void {
    const hasCursorCreatedAt = query.cursor__created_at !== undefined;
    const hasCursorId = query.cursor__id !== undefined;

    if (hasCursorCreatedAt !== hasCursorId) {
      throw new BadRequestException('커서 조회에는 cursor__created_at과 cursor__id가 함께 필요합니다.');
    }

    if (query.cursor__created_at === undefined) {
      return;
    }

    const cursorCreatedAt = new Date(query.cursor__created_at);

    if (Number.isNaN(cursorCreatedAt.getTime())) {
      throw new BadRequestException('cursor__created_at은 유효한 날짜여야 합니다.');
    }
  }

  private validateBandMemberListQuery(query: GetBandMembersQuery): void {
    if (query.order__joined_at !== query.order__id) {
      throw new BadRequestException('order__joined_at과 order__id는 같은 방향이어야 합니다.');
    }

    const hasCursorJoinedAt = query.cursor__joined_at !== undefined;
    const hasCursorId = query.cursor__id !== undefined;

    if (hasCursorJoinedAt !== hasCursorId) {
      throw new BadRequestException('커서 조회에는 cursor__joined_at과 cursor__id가 함께 필요합니다.');
    }

    if (query.cursor__joined_at === undefined) {
      return;
    }

    const cursorJoinedAt = new Date(query.cursor__joined_at);

    if (Number.isNaN(cursorJoinedAt.getTime())) {
      throw new BadRequestException('cursor__joined_at은 유효한 날짜여야 합니다.');
    }
  }

  private validateBandSearchQuery(query: SearchBandsQuery): void {
    if (query.order__created_at !== query.order__id) {
      throw new BadRequestException('order__created_at과 order__id는 같은 방향이어야 합니다.');
    }

    const hasCursorCreatedAt = query.cursor__created_at !== undefined;
    const hasCursorId = query.cursor__id !== undefined;

    if (hasCursorCreatedAt !== hasCursorId) {
      throw new BadRequestException('커서 조회에는 cursor__created_at과 cursor__id가 함께 필요합니다.');
    }

    if (query.cursor__created_at === undefined) {
      return;
    }

    const cursorCreatedAt = new Date(query.cursor__created_at);

    if (Number.isNaN(cursorCreatedAt.getTime())) {
      throw new BadRequestException('cursor__created_at은 유효한 날짜여야 합니다.');
    }
  }

  private validateUpdateBandInput(input: UpdateBandInput): void {
    const hasName = input.name !== undefined;
    const hasDescription = input.description !== undefined;
    const hasVisibility = input.visibility !== undefined;
    const hasCoverImgUrl = input.coverImgUrl !== undefined;

    if (!hasName && !hasDescription && !hasVisibility && !hasCoverImgUrl) {
      throw new BadRequestException('수정할 밴드 정보가 필요합니다.');
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new BadRequestException('밴드 이름은 비어 있을 수 없습니다.');
    }
  }
}
