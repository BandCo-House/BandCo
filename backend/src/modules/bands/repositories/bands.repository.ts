import type { BandMemberRole, Prisma } from '../../../generated/prisma';
import type { CreateBandInput } from '../dto/create-band.dto';
import type { GetBandMembersQuery } from '../dto/get-band-members-query.dto';
import type { GetMyBandsQuery } from '../dto/get-my-bands-query.dto';
import type { SearchBandsQuery } from '../dto/search-bands-query.dto';
import type { UpdateBandInput } from '../dto/update-band.dto';
import type { UpdateBandMemberRoleInput } from '../dto/update-band-member-role.dto';
import type { GetBandMembersResult } from '../types/band-member-list.type';
import type { SearchBandsResult } from '../types/band-search-result.type';
import type { CreateBandInvitationSuccessItem, CreateBandResult } from '../types/create-band-result.type';
import type { DeleteBandResult } from '../types/delete-band-result.type';
import type { LeaveBandResult } from '../types/leave-band-result.type';
import type { GetMyBandsResult } from '../types/my-band-list.type';
import type { UpdateBandMemberRoleResult } from '../types/update-band-member-role-result.type';
import type { UpdateBandResult } from '../types/update-band-result.type';

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
  findBandForLeave(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    member: {
      id: string;
      role: BandMemberRole;
    } | null;
  } | null>;
  leaveBand(bandMemberId: string, tx?: Prisma.TransactionClient): Promise<LeaveBandResult>;
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
  searchBands(query: SearchBandsQuery, tx?: Prisma.TransactionClient): Promise<SearchBandsResult>;
  findActiveBandById(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandMasterUserId: string;
  } | null>;
  updateBand(bandId: string, input: UpdateBandInput, tx?: Prisma.TransactionClient): Promise<UpdateBandResult>;
  findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    userId: string;
  } | null>;
  findExistingGenreIds(genreIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  findExistingUserIds(userIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  updateBandMemberRole(bandMemberId: string, input: UpdateBandMemberRoleInput, tx?: Prisma.TransactionClient): Promise<UpdateBandMemberRoleResult>;
}
