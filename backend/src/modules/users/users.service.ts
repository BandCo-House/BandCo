import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma';

import { DeezerTrackClient, type DeezerTrackSearcher } from '../songs/deezer-track.client';
import { parseDeezerTrackToSongPreview } from '../songs/deezer-track.parser';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import type { UpdateUserProfileData } from './dto/update-user-profile.dto';
import { USERS_REPOSITORY, UsersRepository } from './repositoreis/user.repository';
import type { ProfileMusicPreview } from './types/profile-music-preview.type';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(DeezerTrackClient)
    private readonly deezerTrackSearcher: DeezerTrackSearcher,
  ) {}

  async getUserByEmail(email: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findByEmail(email, tx);
  }

  async createUserWithEmail(email: string, passwordHash: string, tx?: Prisma.TransactionClient) {
    const existingUser = await this.usersRepository.findByEmail(email, tx);
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
    return this.usersRepository.createUserWithEmail(email, passwordHash, tx);
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

  /**
   * Deezer에서 프로필 음악 후보를 검색한다.
   *
   * @param {string} query - 검색어 (곡명 또는 아티스트명)
   * @returns {Promise<ProfileMusicPreview[]>} 프로필 음악 후보 목록
   */
  async searchProfileMusicPreviews(query: string, tx?: Prisma.TransactionClient): Promise<ProfileMusicPreview[]> {
    void tx;
    const deezerTracks = await this.deezerTrackSearcher.searchTracks(query);
    return deezerTracks.map(track => {
      const { releaseDate: _, ...profileMusicPreview } = parseDeezerTrackToSongPreview(track);
      return profileMusicPreview as ProfileMusicPreview;
    });
  }
}
