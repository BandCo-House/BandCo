import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { GenreListResult } from '../types/genre-list.type';
import type { SkillTypeListResult } from '../types/skill-type-list.type';

import type { CommonRepository } from './common.repository';

@Injectable()
export class CommonPrismaRepository implements CommonRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 장르 전체 목록을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GenreListResult>} 장르 목록
   */
  async findAllGenres(tx?: Prisma.TransactionClient): Promise<GenreListResult> {
    const client = tx ?? this.prisma;

    const genres = await client.genre.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return { genres: genres.map(g => ({ genreId: g.id, name: g.name })) };
  }

  /**
   * 스킬 타입 전체 목록을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SkillTypeListResult>} 스킬 타입 목록
   */
  async findAllSkillTypes(tx?: Prisma.TransactionClient): Promise<SkillTypeListResult> {
    const client = tx ?? this.prisma;

    const skillTypes = await client.skillType.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return { skills: skillTypes.map(s => ({ skillTypeId: s.id, name: s.name })) };
  }
}
