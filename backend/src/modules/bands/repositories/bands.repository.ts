import type { Prisma } from '../../../generated/prisma';
import type { CreateBandInput } from '../dto/create-band.dto';
import type { CreateBandInvitationSuccessItem, CreateBandResult } from '../types/create-band-result.type';

export const BANDS_REPOSITORY = Symbol('BANDS_REPOSITORY');

export interface CreateBandRepositoryInput extends CreateBandInput {
  bandMasterUserId: string;
  genreIds: string[];
  inviteeUserIds: string[];
}

export interface CreateBandRepositoryResult extends CreateBandResult {
  band: CreateBandResult['band'] & {
    invitations: {
      success: CreateBandInvitationSuccessItem[];
      failed: [];
    };
  };
}

export interface BandsRepository {
  createBand(input: CreateBandRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateBandRepositoryResult>;
  findExistingGenreIds(genreIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  findExistingUserIds(userIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
}
