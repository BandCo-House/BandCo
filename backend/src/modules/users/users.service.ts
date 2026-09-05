import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type OAuthProvider, Prisma } from 'src/generated/prisma';
import { DeezerTrackClient } from 'src/modules/songs/deezer-track.client';
import type { DeezerTrackApiResponse } from 'src/modules/songs/types/deezer-track-api-response.type';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import type { UpdateUserProfileData } from './dto/update-user-profile.dto';
import { PROFILE_MUSIC_REPOSITORY, ProfileMusicRepository } from './repositoreis/profile-music.repository';
import { USERS_REPOSITORY, UsersRepository } from './repositoreis/user.repository';
import type { CreateOAuthUserInput } from './types/oauth-user.type';
import type { DeleteProfileMusicResult, ProfileMusicTrack } from './types/profile-music.type';

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

  async getUserProfile(userId: string, tx?: Prisma.TransactionClient) {
    const result = await this.usersRepository.findUserProfileById(userId, tx);
    if (!result) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }
    return result;
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileData, tx?: Prisma.TransactionClient) {
    return this.usersRepository.updateUserProfile(userId, data, tx);
  }

  async deleteUser(userId: string, tx?: Prisma.TransactionClient) {
    const result = await this.usersRepository.softDeleteUser(userId, tx);
    if (!result) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }
    return result;
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
