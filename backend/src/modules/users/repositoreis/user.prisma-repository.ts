import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import type { Prisma, User } from 'src/generated/prisma';

import type { GetUsersQuery } from '../dto/get-users-query.dto';
import type { GetUsersResult, UserListItem } from '../types/user-list.type';
import type { GetUserProfileResult } from '../types/user-profile.type';
import { generateRandomNickname } from '../util/nickname_maker';

import type { UsersRepository } from './user.repository';

type UserListRecord = Prisma.UserGetPayload<{
  include: {
    profile: {
      select: { nickname: true; avatarUrl: true };
    };
  };
}>;

function mapUserListItem(user: UserListRecord): UserListItem {
  return {
    id: user.id,
    email: user.email,
    nickname: user.profile?.nickname ?? '',
    status: user.status,
    avatarUrl: user.profile?.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = tx ?? this.prisma;
    return client.user.findUnique({
      where: { email },
    });
  }

  async createUserWithEmail(email: string, passwordHash: string, tx?: Prisma.TransactionClient): Promise<User> {
    const run = async (client: Prisma.TransactionClient) => {
      const user = await client.user.create({
        data: { email, passwordHash },
      });

      await client.userProfile.create({
        data: {
          userId: user.id,
          nickname: generateRandomNickname(),
        },
      });

      return user;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async findUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient): Promise<GetUsersResult> {
    const client = tx ?? this.prisma;

    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (query.where__email__contain) {
      where.email = { contains: query.where__email__contain, mode: 'insensitive' };
    }

    if (query.where__nickname__contain) {
      where.profile = { nickname: { contains: query.where__nickname__contain, mode: 'insensitive' } };
    }

    const users = await client.user.findMany({
      where,
      include: {
        profile: {
          select: { nickname: true, avatarUrl: true },
        },
      },
      orderBy: [{ createdAt: query.order__created_at }, { id: query.order__id }],
      ...(query.cursor__id ? { cursor: { id: query.cursor__id }, skip: 1 } : {}),
      take: query.take,
    });

    const items = users.map(mapUserListItem);
    const count = items.length;
    const cursor = count > 0 ? { createdAt: items[0].createdAt, id: items[0].id } : null;
    const next = count === query.take ? { createdAt: items[count - 1].createdAt, id: items[count - 1].id } : null;

    return { items, meta: { count, take: query.take, cursor, next } };
  }

  async findUserProfileById(userId: string, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult | null> {
    const client = tx ?? this.prisma;

    const user = await client.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        profile: true,
        userSkills: {
          include: { skillType: true },
        },
        favoriteGenres: {
          include: { genre: true },
        },
      },
    });

    if (!user) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
      profile: user.profile
        ? {
            nickname: user.profile.nickname,
            selfDescription: user.profile.selfDescription,
            profileMusicUrl: user.profile.profileMusicUrl,
            avatarUrl: user.profile.avatarUrl,
          }
        : null,
      skills: user.userSkills.map(s => ({
        skillTypeId: s.skillTypeId,
        skillName: s.skillType.name,
        level: s.skillLevel,
        isPrimary: s.isPrimary,
      })),
      favoriteGenres: user.favoriteGenres.map(g => ({
        genreId: g.genreId,
        name: g.genre.name,
      })),
    };
  }
}
