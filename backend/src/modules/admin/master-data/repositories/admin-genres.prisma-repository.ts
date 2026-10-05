import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import type { AdminGenreItem } from '../types/admin-master-data.type';

import type { AdminGenresRepository } from './admin-genres.repository';

/** 장르와 함께 사용 횟수 계산에 필요한 관계 개수를 읽는다. */
const GENRE_SELECT = {
  id: true,
  name: true,
  sortOrder: true,
  _count: { select: { bandGenres: true, favoriteGenres: true } },
} satisfies Prisma.GenreSelect;

type GenreRow = Prisma.GenreGetPayload<{ select: typeof GENRE_SELECT }>;

function toAdminGenreItem(genre: GenreRow): AdminGenreItem {
  return {
    genreId: genre.id,
    name: genre.name,
    sortOrder: genre.sortOrder,
    usageCount: genre._count.bandGenres + genre._count.favoriteGenres,
  };
}

@Injectable()
export class AdminGenresPrismaRepository implements AdminGenresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGenres(tx?: Prisma.TransactionClient): Promise<AdminGenreItem[]> {
    const client = tx ?? this.prisma;
    const genres = await client.genre.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: GENRE_SELECT });
    return genres.map(toAdminGenreItem);
  }

  async findGenreById(genreId: string, tx?: Prisma.TransactionClient): Promise<AdminGenreItem | null> {
    const client = tx ?? this.prisma;
    const genre = await client.genre.findUnique({ where: { id: genreId }, select: GENRE_SELECT });
    if (genre === null) {
      return null;
    }

    return toAdminGenreItem(genre);
  }

  async findGenreIdByName(name: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.genre.findUnique({ where: { name }, select: { id: true } });
  }

  async findMaxGenreSortOrder(tx?: Prisma.TransactionClient): Promise<number | null> {
    const client = tx ?? this.prisma;
    const result = await client.genre.aggregate({ _max: { sortOrder: true } });
    return result._max.sortOrder;
  }

  async createGenre(data: { name: string; sortOrder: number }, tx?: Prisma.TransactionClient): Promise<AdminGenreItem> {
    const client = tx ?? this.prisma;
    const genre = await client.genre.create({ data, select: GENRE_SELECT });
    return toAdminGenreItem(genre);
  }

  async updateGenre(genreId: string, data: { name?: string; sortOrder?: number }, tx?: Prisma.TransactionClient): Promise<AdminGenreItem> {
    const client = tx ?? this.prisma;
    const genre = await client.genre.update({ where: { id: genreId }, data, select: GENRE_SELECT });
    return toAdminGenreItem(genre);
  }

  async deleteGenre(genreId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.genre.delete({ where: { id: genreId } });
  }
}
