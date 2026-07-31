import type { Prisma } from '../../../generated/prisma';
import type {
  BandInviteLinkAccessContext,
  BandInviteLinkItem,
  BandInviteLinkJoinContext,
  JoinedBandMember,
  UpsertBandInviteLinkInput,
} from '../types/band-invite-link.type';

export const BAND_INVITE_LINKS_REPOSITORY = Symbol('BAND_INVITE_LINKS_REPOSITORY');

export interface BandInviteLinksRepository {
  findActiveBandWithRequesterMember(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<BandInviteLinkAccessContext | null>;
  upsertBandInviteLink(input: UpsertBandInviteLinkInput, tx?: Prisma.TransactionClient): Promise<BandInviteLinkItem>;
  deleteBandInviteLinkByBandId(bandId: string, tx?: Prisma.TransactionClient): Promise<boolean>;
  findBandInviteLinkByCodeHash(codeHash: string, tx?: Prisma.TransactionClient): Promise<BandInviteLinkJoinContext | null>;
  findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
  } | null>;
  findBandBlacklistByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
  } | null>;
  createBandMember(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<JoinedBandMember>;
  deletePendingBandEntryRequests(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<void>;
}
