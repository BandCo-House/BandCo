import { Inject, Injectable } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';

import { COMMON_REPOSITORY, type CommonRepository } from './repositories/common.repository';
import type { GenreListResult } from './types/genre-list.type';
import type { SkillTypeListResult } from './types/skill-type-list.type';

@Injectable()
export class CommonService {
  constructor(
    @Inject(COMMON_REPOSITORY)
    private readonly commonRepository: CommonRepository,
  ) {}

  /**
   * 장르 전체 목록을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GenreListResult>} 장르 목록
   */
  async getGenres(tx?: Prisma.TransactionClient): Promise<GenreListResult> {
    return this.commonRepository.findAllGenres(tx);
  }

  /**
   * 스킬 타입 전체 목록을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SkillTypeListResult>} 스킬 타입 목록
   */
  async getSkillTypes(tx?: Prisma.TransactionClient): Promise<SkillTypeListResult> {
    return this.commonRepository.findAllSkillTypes(tx);
  }
}
