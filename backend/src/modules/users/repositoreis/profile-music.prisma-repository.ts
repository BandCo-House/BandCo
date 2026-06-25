import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma';

import type { DeleteProfileMusicResult, ProfileMusicTrack } from '../types/profile-music.type';

import type { ProfileMusicRepository } from './profile-music.repository';

@Injectable()
export class ProfileMusicPrismaRepository implements ProfileMusicRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<ProfileMusicTrack | null> {
    const client = tx ?? this.prisma;
    const record = await client.profileMusic.findUnique({ where: { userId } });
    if (!record) return null;
    return record.trackData as unknown as ProfileMusicTrack;
  }

  async upsertByUserId(userId: string, trackData: ProfileMusicTrack, tx?: Prisma.TransactionClient): Promise<ProfileMusicTrack> {
    const client = tx ?? this.prisma;
    const record = await client.profileMusic.upsert({
      where: { userId },
      create: { userId, trackData: trackData as unknown as Prisma.InputJsonValue },
      update: { trackData: trackData as unknown as Prisma.InputJsonValue },
    });
    return record.trackData as unknown as ProfileMusicTrack;
  }

  async deleteByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<DeleteProfileMusicResult | null> {
    const client = tx ?? this.prisma;
    try {
      await client.profileMusic.delete({ where: { userId } });
      return { userId, deletedAt: new Date().toISOString() };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    }
  }
}
