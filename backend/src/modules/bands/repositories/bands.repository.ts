import type { BandInvitationStatus, BandMemberRole, JoinRequestStatus, Prisma } from '../../../generated/prisma';
import type { CreateBandInput } from '../dto/create-band.dto';
import type { CreateBandInvitationInput } from '../dto/create-band-invitation.dto';
import type { CreateBandJoinRequestInput } from '../dto/create-band-join-request.dto';
import type { GetBandJoinRequestsQuery } from '../dto/get-band-join-requests-query.dto';
import type { GetBandMembersQuery } from '../dto/get-band-members-query.dto';
import type { GetMyBandsQuery } from '../dto/get-my-bands-query.dto';
import type { GetReceivedBandInvitationsQuery } from '../dto/get-received-band-invitations-query.dto';
import type { GetSentBandInvitationsQuery } from '../dto/get-sent-band-invitations-query.dto';
import type { GetSentBandJoinRequestsQuery } from '../dto/get-sent-band-join-requests-query.dto';
import type { SearchBandsQuery } from '../dto/search-bands-query.dto';
import type { UpdateBandInput } from '../dto/update-band.dto';
import type { UpdateBandMemberRoleInput } from '../dto/update-band-member-role.dto';
import type { AcceptBandInvitationResult } from '../types/accept-band-invitation-result.type';
import type { ApproveBandJoinRequestResult } from '../types/approve-band-join-request-result.type';
import type { GetBandJoinRequestsResult } from '../types/band-join-request-list.type';
import type { GetBandMembersResult } from '../types/band-member-list.type';
import type { SearchBandsResult } from '../types/band-search-result.type';
import type { CreateBandInvitationResult } from '../types/create-band-invitation-result.type';
import type { CreateBandJoinRequestResult } from '../types/create-band-join-request-result.type';
import type { CreateBandInvitationSuccessItem, CreateBandResult } from '../types/create-band-result.type';
import type { DeclineBandInvitationResult } from '../types/decline-band-invitation-result.type';
import type { DeleteBandInvitationResult } from '../types/delete-band-invitation-result.type';
import type { DeleteBandResult } from '../types/delete-band-result.type';
import type { GetBandResult } from '../types/get-band-result.type';
import type { LeaveBandResult } from '../types/leave-band-result.type';
import type { GetMyBandsResult } from '../types/my-band-list.type';
import type { GetReceivedBandInvitationsResult, ReceivedBandInvitationListItem } from '../types/received-band-invitation-list.type';
import type { RejectBandJoinRequestResult } from '../types/reject-band-join-request-result.type';
import type { GetSentBandInvitationsResult } from '../types/sent-band-invitation-list.type';
import type { GetSentBandJoinRequestsResult } from '../types/sent-band-join-request-list.type';
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

export interface CreateBandInvitationRepositoryInput extends CreateBandInvitationInput {
  bandId: string;
  inviterBandMemberId: string;
}

export interface CreateBandJoinRequestRepositoryInput extends CreateBandJoinRequestInput {
  bandId: string;
  userId: string;
}

export interface BandsRepository {
  acceptBandInvitation(
    invitationId: string,
    bandId: string,
    userId: string,
    respondedAt: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AcceptBandInvitationResult>;
  createBand(input: CreateBandRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateBandRepositoryResult>;
  createBandInvitation(input: CreateBandInvitationRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateBandInvitationResult>;
  createBandJoinRequest(input: CreateBandJoinRequestRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateBandJoinRequestResult>;
  approveBandJoinRequest(joinRequestId: string, bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<ApproveBandJoinRequestResult>;
  rejectBandJoinRequest(joinRequestId: string, tx?: Prisma.TransactionClient): Promise<RejectBandJoinRequestResult>;
  deleteBand(bandId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<DeleteBandResult>;
  deleteBandInvitation(invitationId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandInvitationResult>;
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
  findBandMembers(bandId: string, query: GetBandMembersQuery, tx?: Prisma.TransactionClient): Promise<GetBandMembersResult>;
  findMyBands(userId: string, query: GetMyBandsQuery, tx?: Prisma.TransactionClient): Promise<GetMyBandsResult>;
  findReceivedBandInvitations(
    userId: string,
    query: GetReceivedBandInvitationsQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetReceivedBandInvitationsResult>;
  findBandInvitationDetail(invitationId: string, tx?: Prisma.TransactionClient): Promise<ReceivedBandInvitationListItem | null>;
  findSentBandInvitations(userId: string, query: GetSentBandInvitationsQuery, tx?: Prisma.TransactionClient): Promise<GetSentBandInvitationsResult>;
  findSentBandJoinRequests(
    userId: string,
    query: GetSentBandJoinRequestsQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetSentBandJoinRequestsResult>;
  findBandJoinRequests(bandId: string, query: GetBandJoinRequestsQuery, tx?: Prisma.TransactionClient): Promise<GetBandJoinRequestsResult>;
  searchBands(query: SearchBandsQuery, tx?: Prisma.TransactionClient): Promise<SearchBandsResult>;
  findActiveBandById(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandMasterUserId: string;
  } | null>;
  findBandForJoinRequest(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    visibility: boolean;
  } | null>;
  findBandJoinRequestByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    status: JoinRequestStatus;
  } | null>;
  findBandJoinRequestForResponse(
    joinRequestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandId: string;
    userId: string;
    status: JoinRequestStatus;
  } | null>;
  findBandManagerUserIdsByBandId(bandId: string, tx?: Prisma.TransactionClient): Promise<string[]>;
  updateBand(bandId: string, input: UpdateBandInput, tx?: Prisma.TransactionClient): Promise<UpdateBandResult>;
  findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    userId: string;
    role: BandMemberRole;
  } | null>;
  findBandInvitationByBandIdAndInviteeUserId(
    bandId: string,
    inviteeUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    status: BandInvitationStatus;
  } | null>;
  findBandInvitationForDelete(
    invitationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    status: BandInvitationStatus;
    inviterUserId: string;
  } | null>;
  declineBandInvitation(invitationId: string, respondedAt: Date, tx?: Prisma.TransactionClient): Promise<DeclineBandInvitationResult>;
  findBandInvitationForResponse(
    invitationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandId: string;
    inviterUserId: string;
    inviteeUserId: string;
    status: BandInvitationStatus;
  } | null>;
  findBandBlacklistByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
  } | null>;
  findExistingGenreIds(genreIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  findExistingUserIds(userIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  updateBandMemberRole(bandMemberId: string, input: UpdateBandMemberRoleInput, tx?: Prisma.TransactionClient): Promise<UpdateBandMemberRoleResult>;
  findBandDetail(bandId: string, tx?: Prisma.TransactionClient): Promise<GetBandResult['band'] | null>;
}
