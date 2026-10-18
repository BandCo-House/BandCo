import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type OAuthProvider, Prisma } from 'src/generated/prisma';
import { DeezerTrackClient } from 'src/modules/songs/deezer-track.client';
import type { DeezerTrackApiResponse } from 'src/modules/songs/types/deezer-track-api-response.type';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import type { UpdateUserProfileData } from './dto/update-user-profile.dto';
import { PROFILE_MUSIC_REPOSITORY, ProfileMusicRepository } from './repositoreis/profile-music.repository';
import { type ActiveSuspension, USERS_REPOSITORY, UsersRepository } from './repositoreis/user.repository';
import type { CreateOAuthUserInput } from './types/oauth-user.type';
import type { DeleteProfileMusicResult, ProfileMusicTrack } from './types/profile-music.type';
import type { ChangeHandleResult, HandleAvailabilityResult } from './types/user-handle.type';
import type { GetUserProfileResult, UserProfileRecord } from './types/user-profile.type';
import { getHandleChangeableAt } from './util/handle-cooldown';

/** 마지막 접속 시각을 이 간격 안에서는 다시 쓰지 않는다. DAU 집계에는 충분하고 쓰기 부하는 줄인다. */
const LAST_LOGIN_UPDATE_INTERVAL_MS = 10 * 60 * 1000;

const HANDLE_TAKEN_MESSAGE = '이미 사용 중인 고유 ID입니다.';
// 다음 변경 가능 시각은 프론트가 응답 필드로 포맷해 보여주므로 메시지에는 넣지 않는다
const HANDLE_COOLDOWN_MESSAGE = '고유 ID는 7일에 한 번만 변경할 수 있습니다.';

/**
 * Repository 원본을 응답 형태로 바꾼다.
 * 이메일은 본인 조회에서만 담고(#212 B-4), 고유 ID 다음 변경 가능 시각도 본인에게만 보여준다.
 * 고유 ID 자체는 공개 식별자라 다른 사람이 조회해도 담는다.
 */
function toUserProfileResult(record: UserProfileRecord, isSelf: boolean, now: Date): GetUserProfileResult {
  const user = isSelf ? record.user : { ...record.user, email: null };
  if (!record.profile) {
    return { ...record, user, profile: null };
  }

  const { handleChangedAt, ...profileFields } = record.profile;
  const changeableAt = isSelf ? getHandleChangeableAt(handleChangedAt, now) : null;
  const profile = { ...profileFields, handleChangeableAt: changeableAt?.toISOString() ?? null };

  return { ...record, user, profile };
}

function toChangeHandleResult(userId: string, handle: string, handleChangedAt: Date | null, now: Date): ChangeHandleResult {
  const changeableAt = getHandleChangeableAt(handleChangedAt, now);
  return {
    userId,
    handle,
    handleChangedAt: handleChangedAt?.toISOString() ?? null,
    handleChangeableAt: changeableAt?.toISOString() ?? null,
  };
}

function toDeezerProfileMusicTrack(track: DeezerTrackApiResponse): ProfileMusicTrack {
  return {
    externalTrackId: String(track.id),
    sourceType: 'DEEZER',
    title: track.title,
    artistName: track.artist.name,
    albumName: track.album.title,
    albumImageUrl: track.album.cover_xl || track.album.cover_big || track.album.cover_medium || track.album.cover || null,
    durationMs: track.duration * 1000,
    previewUrl: track.preview,
    sourceUrl: track.link,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PROFILE_MUSIC_REPOSITORY)
    private readonly profileMusicRepository: ProfileMusicRepository,
    @Inject(DeezerTrackClient)
    private readonly deezerTrackClient: DeezerTrackClient,
  ) {}

  async getUserByEmail(email: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findByEmail(email, tx);
  }

  async getAuthUserById(id: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findAuthUserById(id, tx);
  }

  async getUserForPasswordAuth(email: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findUserForPasswordAuth(email, tx);
  }

  /**
   * 지금 효력이 있는 이용 정지를 조회한다. 로그인 단계에서 정지 안내 문구를 만들 때 쓴다.
   *
   * @param {string} userId - 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ActiveSuspension | null>} 활성 정지 또는 null
   */
  async getActiveSuspension(userId: string, tx?: Prisma.TransactionClient): Promise<ActiveSuspension | null> {
    return this.usersRepository.findActiveSuspension(userId, new Date(), tx);
  }

  /**
   * 로그인·토큰 재발급 시 마지막 접속 시각을 남긴다. 어드민 대시보드의 DAU/WAU/MAU 근거가 된다.
   *
   * @param {string} userId - 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 갱신 완료
   */
  async recordLastLogin(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const now = new Date();
    const skipIfAfter = new Date(now.getTime() - LAST_LOGIN_UPDATE_INTERVAL_MS);
    await this.usersRepository.updateLastLoginAt(userId, now, skipIfAfter, tx);
  }

  /**
   * 이메일 유저와 프로필을 생성한다.
   *
   * 중복 검사와 생성 사이에 동시 요청이 끼어들 수 있어, User.email 유니크 제약
   * 위반(P2002)도 사전 검사와 동일한 예외로 변환한다.
   * @param nickname 프로필 닉네임으로 저장할 이름
   */
  async createUserWithEmail(email: string, passwordHash: string, nickname: string, tx?: Prisma.TransactionClient) {
    const existingUser = await this.usersRepository.findByEmail(email, tx);
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
    try {
      return await this.usersRepository.createUserWithEmail(email, passwordHash, nickname, tx);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('이미 존재하는 이메일입니다.');
      }
      throw error;
    }
  }

  async getUserByOAuth(provider: OAuthProvider, providerUserId: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findUserByOAuth(provider, providerUserId, tx);
  }

  async getUserForOAuthLink(email: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findUserForOAuthLink(email, tx);
  }

  /**
   * 기존 유저에 OAuth 계정을 연결한다.
   *
   * 동시 로그인 요청으로 같은 OAuth 계정이 중복 연결될 수 있어,
   * 유니크 제약 위반(P2002)을 BadRequestException으로 변환한다.
   */
  async linkOAuthAccount(userId: string, provider: OAuthProvider, providerUserId: string, email: string, tx?: Prisma.TransactionClient) {
    try {
      await this.usersRepository.createOAuthAccount(userId, provider, providerUserId, email, tx);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('이미 연결된 OAuth 계정입니다.');
      }
      throw error;
    }
  }

  /**
   * OAuth 유저와 프로필, OAuth 계정 연결을 함께 생성한다.
   *
   * 사전 조회와 생성 사이에 동시 요청이 끼어들 수 있어,
   * User.email 유니크 제약 위반(P2002)을 BadRequestException으로 변환한다.
   */
  async createUserWithGoogle(input: CreateOAuthUserInput, tx?: Prisma.TransactionClient) {
    try {
      return await this.usersRepository.createUserWithOAuth(input, tx);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('이미 존재하는 이메일입니다.');
      }
      throw error;
    }
  }

  async getUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findUsers(query, tx);
  }

  /**
   * 유저 프로필을 조회한다.
   *
   * 이메일은 본인이 조회할 때만 담는다 — 다른 사용자의 프로필에서 이메일이 그대로
   * 나가던 문제를 막는다(#212 B-4). 프론트 스키마는 `email`을 nullable로 받는다.
   * 고유 ID 다음 변경 가능 시각도 마이페이지에서만 쓰므로 본인 조회에만 담는다.
   *
   * @param {string} userId - 조회할 유저 ID
   * @param {string | undefined} viewerUserId - 조회를 요청한 인증 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   */
  async getUserProfile(userId: string, viewerUserId?: string, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult> {
    const record = await this.usersRepository.findUserProfileById(userId, tx);
    if (!record) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }
    const isSelf = viewerUserId === userId;
    return toUserProfileResult(record, isSelf, new Date());
  }

  /**
   * 본인 프로필을 수정한다. 수정 결과는 본인에게 돌려주므로 이메일과 고유 ID 쿨다운 정보를 그대로 담는다.
   */
  async updateUserProfile(userId: string, data: UpdateUserProfileData, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult> {
    const record = await this.usersRepository.updateUserProfile(userId, data, tx);
    return toUserProfileResult(record, true, new Date());
  }

  async deleteUser(userId: string, tx?: Prisma.TransactionClient) {
    const result = await this.usersRepository.softDeleteUser(userId, tx);
    if (!result) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }
    return result;
  }

  /**
   * 마이페이지에서 고유 ID를 저장하기 전에 쓸 수 있는 값인지 확인한다.
   * 지금 본인이 쓰고 있는 값(대소문자만 다른 경우 포함)은 그대로 저장해도 되므로 사용 가능으로 본다.
   *
   * @param {string} handle - 형식 검증을 통과한 고유 ID
   * @param {string} viewerUserId - 확인을 요청한 인증 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<HandleAvailabilityResult>} 사용 가능 여부
   */
  async checkHandleAvailability(handle: string, viewerUserId: string, tx?: Prisma.TransactionClient): Promise<HandleAvailabilityResult> {
    const owner = await this.usersRepository.findUserIdByHandle(handle, tx);
    const isTakenByOther = owner !== null && owner.id !== viewerUserId;

    return { handle, available: !isTakenByOther };
  }

  /**
   * 고유 ID를 바꾼다. 한 번 바꾸면 7일간 다시 바꿀 수 없고, 비어 있던 ID를 처음 정하는 것은 쿨다운에 세지 않는다.
   *
   * 중복 검사와 저장 사이에 다른 유저가 같은 값을 먼저 가져가면 유니크 제약 위반(P2002)으로,
   * 같은 유저의 동시 변경은 저장 조건(현재 handle 일치)으로 막는다.
   *
   * @param {string} userId - 고유 ID를 바꿀 유저 ID
   * @param {string} handle - 형식 검증을 통과한 새 고유 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ChangeHandleResult>} 변경 후 고유 ID와 쿨다운 정보
   */
  async changeHandle(userId: string, handle: string, tx?: Prisma.TransactionClient): Promise<ChangeHandleResult> {
    const now = new Date();
    const state = await this.usersRepository.findHandleState(userId, tx);
    if (!state) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    // 지금 값과 똑같이 저장하면 아무것도 바꾸지 않으므로 쿨다운도 소모하지 않는다
    if (state.handle === handle) {
      return toChangeHandleResult(userId, handle, state.handleChangedAt, now);
    }

    const changeableAt = getHandleChangeableAt(state.handleChangedAt, now);
    if (changeableAt !== null) {
      throw new BadRequestException(HANDLE_COOLDOWN_MESSAGE);
    }

    const owner = await this.usersRepository.findUserIdByHandle(handle, tx);
    const isTakenByOther = owner !== null && owner.id !== userId;
    if (isTakenByOther) {
      throw new BadRequestException(HANDLE_TAKEN_MESSAGE);
    }

    // 처음 설정은 쿨다운에 세지 않아 직후 한 번은 바로 고칠 수 있다(오타 구제)
    const isFirstSet = state.handle === null;
    const changedAt = isFirstSet ? null : now;

    let isUpdated: boolean;
    try {
      isUpdated = await this.usersRepository.updateHandle(userId, { currentHandle: state.handle, newHandle: handle, changedAt }, tx);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(HANDLE_TAKEN_MESSAGE);
      }
      throw error;
    }

    if (!isUpdated) {
      throw new BadRequestException('고유 ID가 방금 다른 요청으로 변경되었습니다. 다시 시도해 주세요.');
    }

    return toChangeHandleResult(userId, handle, changedAt, now);
  }

  /**
   * Deezer에서 트랙을 검색하여 프로필 음악 후보 목록을 반환한다.
   */
  async searchProfileMusic(query: string): Promise<{ items: ProfileMusicTrack[] }> {
    const tracks = await this.deezerTrackClient.searchTracks(query);
    return { items: tracks.map(toDeezerProfileMusicTrack) };
  }

  /**
   * 유저의 프로필 음악을 삭제한다.
   * 존재하지 않으면 NotFoundException을 던진다.
   */
  async deleteProfileMusic(userId: string, tx?: Prisma.TransactionClient): Promise<DeleteProfileMusicResult> {
    const result = await this.profileMusicRepository.deleteByUserId(userId, tx);
    if (!result) {
      throw new NotFoundException('프로필 음악이 존재하지 않습니다.');
    }
    return result;
  }
}
