import type { Prisma } from '../../../generated/prisma';
import type { CreateBandInput } from '../dto/create-band.dto';
import type { GetBandMembersQuery } from '../dto/get-band-members-query.dto';
import type { GetMyBandsQuery } from '../dto/get-my-bands-query.dto';
import type { UpdateBandMemberRoleInput } from '../dto/update-band-member-role.dto';
import type { GetBandMembersResult } from '../types/band-member-list.type';
import type { CreateBandInvitationSuccessItem, CreateBandResult } from '../types/create-band-result.type';
import type { DeleteBandResult } from '../types/delete-band-result.type';
import type { GetMyBandsResult } from '../types/my-band-list.type';
import type { UpdateBandMemberRoleResult } from '../types/update-band-member-role-result.type';

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
  deleteBand(bandId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<DeleteBandResult>;
  findBandForMemberList(
    bandId: string,
    requesterUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    requesterMemberId: string | null;
  } | null>;
  findBandMembers(bandId: string, query: GetBandMembersQuery, tx?: Prisma.TransactionClient): Promise<GetBandMembersResult>;
  findMyBands(userId: string, query: GetMyBandsQuery, tx?: Prisma.TransactionClient): Promise<GetMyBandsResult>;
  findBandForMemberRoleUpdate(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandMasterUserId: string;
  } | null>;
  findBandMemberForRoleUpdate(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    userId: string;
  } | null>;
  findBandForDelete(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandMasterUserId: string;
  } | null>;
  findExistingGenreIds(genreIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  findExistingUserIds(userIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  updateBandMemberRole(bandMemberId: string, input: UpdateBandMemberRoleInput, tx?: Prisma.TransactionClient): Promise<UpdateBandMemberRoleResult>;
}
