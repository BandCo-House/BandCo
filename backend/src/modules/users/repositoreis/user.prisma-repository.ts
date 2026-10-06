import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { parseToPrismaQuery } from 'src/common/query';
import { buildNextPath } from 'src/common/url';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { type OAuthProvider, Prisma, type User } from 'src/generated/prisma';

import type { GetUsersQuery } from '../dto/get-users-query.dto';
import type { UpdateUserProfileData } from '../dto/update-user-profile.dto';
import type { CreateOAuthUserInput, OAuthLinkUser } from '../types/oauth-user.type';
import type { ProfileMusicTrack } from '../types/profile-music.type';
import type { GetUsersResult, UserListItem } from '../types/user-list.type';
import type { GetUserProfileResult } from '../types/user-profile.type';

import type { AuthUser, DeleteUserResult, PasswordAuthUser, UsersRepository } from './user.repository';

// 유저 목록 조회가 끌고 오는 관계. 세션(userSkills)은 닉네임이 겹칠 때 누가 누구인지
// 가르는 유일한 단서라, 초대 검색 화면이 이걸 보여준다.
const userListInclude = {
  profile: {
    select: { nickname: true, avatarUrl: true },
  },
  userSkills: {
    include: {
      skillType: {
        select: { name: true },
      },
    },
  },
} satisfies Prisma.UserInclude;

type UserListRecord = Prisma.UserGetPayload<{ include: typeof userListInclude }>;

function mapUserListItem(user: UserListRecord): UserListItem {
  return {
    id: user.id,
    nickname: user.profile?.nickname ?? '',
    status: user.status,
    avatarUrl: user.profile?.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
    skills: user.userSkills.map(skill => ({
      skillTypeId: skill.skillTypeId,
      skillName: skill.skillType.name,
      skillLevel: skill.skillLevel,
      isPrimary: skill.isPrimary,
    })),
  };
}

function mapAuthUser(user: { id: string; email: string | null } | null): AuthUser | null {
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null> {
    const client = tx ?? this.prisma;
    const user = await client.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    return mapAuthUser(user);
  }

  async findAuthUserById(id: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null> {
    const client = tx ?? this.prisma;
    const user = await client.user.findFirst({
      where: { id, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, email: true },
    });

    return mapAuthUser(user);
  }

  async findUserForPasswordAuth(email: string, tx?: Prisma.TransactionClient): Promise<PasswordAuthUser | null> {
    const client = tx ?? this.prisma;
    const user = await client.user.findFirst({
      where: { email, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user?.email) return null;

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }

  async createUserWithEmail(email: string, passwordHash: string, nickname: string, tx?: Prisma.TransactionClient): Promise<User> {
    const run = async (client: Prisma.TransactionClient) => {
      const user = await client.user.create({
        data: { email, passwordHash },
      });

      await client.userProfile.create({
        data: {
          userId: user.id,
          nickname,
        },
      });

      return user;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async findUserByOAuth(provider: OAuthProvider, providerUserId: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null> {
    const client = tx ?? this.prisma;
    const account = await client.userOAuthAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
      select: {
        user: {
          select: { id: true, email: true, deletedAt: true, status: true },
        },
      },
    });

    if (!account) return null;

    // 연결은 남아 있어도 탈퇴·비활성 유저는 인증 대상에서 제외한다
    if (account.user.deletedAt !== null || account.user.status !== 'ACTIVE') return null;

    return mapAuthUser(account.user);
  }

  async findUserForOAuthLink(email: string, tx?: Prisma.TransactionClient): Promise<OAuthLinkUser | null> {
    const client = tx ?? this.prisma;
    // 탈퇴 계정과 신규 가입을 구분해야 하므로 deletedAt 조건 없이 조회한다
    const user = await client.user.findUnique({
      where: { email },
      select: { id: true, email: true, deletedAt: true, status: true },
    });

    if (!user?.email) return null;

    return { id: user.id, email: user.email, deletedAt: user.deletedAt, status: user.status };
  }

  async createOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerUserId: string,
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.userOAuthAccount.create({
      data: { userId, provider, providerUserId, email },
    });
  }

  async createUserWithOAuth(input: CreateOAuthUserInput, tx?: Prisma.TransactionClient): Promise<User> {
    const run = async (client: Prisma.TransactionClient) => {
      const user = await client.user.create({
        data: { email: input.email },
      });

      await client.userProfile.create({
        data: {
          userId: user.id,
          nickname: input.nickname,
        },
      });

      await client.userOAuthAccount.create({
        data: {
          userId: user.id,
          provider: input.provider,
          providerUserId: input.providerUserId,
          email: input.email,
        },
      });

      return user;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async findUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient): Promise<GetUsersResult> {
    const client = tx ?? this.prisma;
    const { where, orderBy, take } = parseToPrismaQuery<Prisma.UserWhereInput>(query);

    // 삭제되지 않은 유저만 조회
    where.deletedAt = null;

    // nickname은 profile 관계 필드이므로 파서 결과를 보정한다
    if (where.nickname) {
      where.profile = { nickname: where.nickname };
      delete where.nickname;
    }

    // cursor__created_at + cursor__id 두 필드를 복합 keyset 조건으로 변환한다.
    // Prisma cursor + skip 방식은 cursor 레코드 위치를 내부적으로 조회하므로
    // soft-delete된 레코드가 커서가 될 경우 WHERE 필터와 충돌할 수 있다.
    if (query.cursor__created_at && query.cursor__id) {
      const cursorDate = new Date(query.cursor__created_at);
      const dateOp = query.order__created_at === 'asc' ? 'gt' : 'lt';
      const idOp = query.order__id === 'asc' ? 'gt' : 'lt';
      where.AND = [{ OR: [{ createdAt: { [dateOp]: cursorDate } }, { createdAt: { equals: cursorDate }, id: { [idOp]: query.cursor__id } }] }];
    }

    const users = await client.user.findMany({
      where,
      include: userListInclude,
      orderBy,
      take: take ?? query.take,
    });

    const items = users.map(mapUserListItem);
    const count = items.length;
    const cursorMeta = count > 0 ? { createdAt: items[0].createdAt, id: items[0].id } : null;
    const resolvedTake = take ?? query.take;
    const lastItem = items[count - 1];
    const next =
      count === resolvedTake && lastItem
        ? buildNextPath('/users', {
            cursor__created_at: lastItem.createdAt,
            cursor__id: lastItem.id,
            take: resolvedTake,
            order__created_at: query.order__created_at,
            order__id: query.order__id,
            where__nickname__contain: query.where__nickname__contain,
          })
        : null;

    return { items, meta: { count, take: resolvedTake, cursor: cursorMeta, next } };
  }

  async findUserProfileById(userId: string, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult | null> {
    const client = tx ?? this.prisma;

    const user = await client.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        profile: true,
        profileMusic: true,
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
            avatarUrl: user.profile.avatarUrl,
            // 수정 요청(profile.profileMusic)과 같은 위치로 응답한다
            profileMusic: user.profileMusic ? (user.profileMusic.trackData as unknown as ProfileMusicTrack) : null,
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

  async updateUserProfile(userId: string, data: UpdateUserProfileData, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult> {
    const run = async (client: Prisma.TransactionClient) => {
      if (data.profile) {
        const { profileMusic, ...profileFields } = data.profile;
        if (Object.keys(profileFields).length > 0) {
          await client.userProfile.update({ where: { userId }, data: profileFields });
        }
        if (profileMusic) {
          try {
            await client.profileMusic.upsert({
              where: { userId },
              create: { userId, trackData: profileMusic as unknown as Prisma.InputJsonValue },
              update: { trackData: profileMusic as unknown as Prisma.InputJsonValue },
            });
          } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === 'P2003' || e.code === 'P2025')) {
              throw new NotFoundException('존재하지 않는 유저입니다.');
            }
            throw e;
          }
        }
      }

      if (data.personalInfo?.email) {
        await client.user.update({ where: { id: userId }, data: { email: data.personalInfo.email } });
      }

      // skillTypeId·genreId는 DTO에서 UUID 형식만 검사한다. 존재하지 않는 ID는 FK 위반(P2003)으로
      // 터지는데, 이는 요청값 문제이므로 500이 아니라 400으로 돌려준다(#212 B-4).
      if (data.skills !== undefined) {
        await client.userSkill.deleteMany({ where: { userId } });
        if (data.skills.length > 0) {
          try {
            await client.userSkill.createMany({
              data: data.skills.map(s => ({ userId, skillTypeId: s.skillTypeId, skillLevel: s.level, isPrimary: s.isPrimary })),
            });
          } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
              throw new BadRequestException('존재하지 않는 세션(skillTypeId)입니다.');
            }
            throw e;
          }
        }
      }

      if (data.favoriteGenres !== undefined) {
        await client.favoriteGenre.deleteMany({ where: { userId } });
        if (data.favoriteGenres.length > 0) {
          try {
            await client.favoriteGenre.createMany({
              data: data.favoriteGenres.map(genreId => ({ userId, genreId })),
            });
          } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
              throw new BadRequestException('존재하지 않는 장르(genreId)입니다.');
            }
            throw e;
          }
        }
      }
    };

    if (tx) {
      await run(tx);
    } else {
      await this.prisma.$transaction(run);
    }

    const result = await this.findUserProfileById(userId, tx);
    if (!result) {
      throw new Error('업데이트된 유저 프로필을 불러오는 데 실패했습니다.');
    }
    return result;
  }

  async softDeleteUser(userId: string, tx?: Prisma.TransactionClient): Promise<DeleteUserResult | null> {
    const client = tx ?? this.prisma;
    try {
      const user = await client.user.update({
        where: { id: userId, deletedAt: null },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
        select: { id: true, deletedAt: true },
      });
      return { userId: user.id, deletedAt: user.deletedAt!.toISOString() };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    }
  }
}
