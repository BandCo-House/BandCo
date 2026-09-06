import type { Prisma } from '../../../generated/prisma';
import type { AddBandSpaceMemberInput } from '../dto/add-bandspace-member.dto';
import type { CreateBandSpaceInput } from '../dto/create-band-space.dto';
import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { UpdateBandSpaceInput } from '../dto/update-band-space.dto';
import type { UpdateBandSpaceMemberRoleInput } from '../dto/update-bandspace-member-role.dto';
import type { AddBandSpaceMemberResult } from '../types/add-bandspace-member-result.type';
import type { GetBandSpacesResult } from '../types/band-space-list-item.type';
import type { GetBandSpaceDetailResult } from '../types/bandspace-detail.type';
import type { CreateBandSpaceResult } from '../types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from '../types/delete-band-space-result.type';
import type { RemoveBandSpaceMemberResult } from '../types/remove-bandspace-member-result.type';
import type { UpdateBandSpaceResult } from '../types/update-band-space-result.type';
import type { UpdateBandSpaceMemberRoleResult } from '../types/update-bandspace-member-role-result.type';

export const BAND_SPACES_REPOSITORY = Symbol('BAND_SPACES_REPOSITORY');

/** addBandSpaceMember 저장소 반환 타입. userId, spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
export interface AddBandSpaceMemberRepositoryResult extends AddBandSpaceMemberResult {
  userId: string;
  spaceName: string;
}

/** updateBandSpaceMemberRole 저장소 반환 타입. spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
export interface UpdateBandSpaceMemberRoleRepositoryResult extends UpdateBandSpaceMemberRoleResult {
  spaceName: string;
}

/** removeBandSpaceMember 저장소 반환 타입. recipientUserId, spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
export interface RemoveBandSpaceMemberRepositoryResult extends RemoveBandSpaceMemberResult {
  recipientUserId: string;
  spaceName: string;
}

export interface BandSpacesRepository {
  addBandSpaceMember(spaceId: string, input: AddBandSpaceMemberInput, tx?: Prisma.TransactionClient): Promise<AddBandSpaceMemberRepositoryResult>;
  /** requesterBandMemberId를 생성자·LEADER 멤버로 기록한다. */
  createBandSpace(
    bandId: string,
    requesterBandMemberId: string,
    input: CreateBandSpaceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateBandSpaceResult>;
  /** requesterBandMemberId를 isMine·onlyMine·myMembership 판별에 사용한다. */
  findBandSpaces(
    bandId: string,
    requesterBandMemberId: string,
    query: GetBandSpacesQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandSpacesResult>;
  findDetailByBandSpaceId(spaceId: string, tx?: Prisma.TransactionClient): Promise<GetBandSpaceDetailResult | undefined>;
  /** 밴드 멤버 전체의 userId 배열을 반환한다. 공간 생성 시 알림 수신자 조회에 사용한다. */
  findBandMemberUserIds(bandId: string, tx?: Prisma.TransactionClient): Promise<string[]>;
  /** 밴드가 존재하고 삭제되지 않았는지 확인한다. */
  findBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;
  /** bandId + userId로 요청자의 밴드 멤버를 조회한다. 밴드가 삭제된 경우도 없는 것으로 취급한다. */
  findBandMemberByBandIdAndUserId(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;
  /** 합주 공간이 속한 밴드 ID를 조회한다. 공간이 없거나 삭제되었으면 null. */
  findBandIdBySpaceId(spaceId: string, tx?: Prisma.TransactionClient): Promise<string | null>;
  /** 전달된 필드만 업데이트한다 (PATCH 패턴). */
  updateBandSpace(spaceId: string, input: UpdateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<UpdateBandSpaceResult>;
  /** deletedAt을 현재 시각으로 설정한다 (soft delete). */
  deleteBandSpace(spaceId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandSpaceResult>;
  /** 역할을 업데이트하고 알림용 spaceName, userId를 반환한다. */
  updateBandSpaceMemberRole(
    spaceId: string,
    memberId: string,
    input: UpdateBandSpaceMemberRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateBandSpaceMemberRoleRepositoryResult>;
  /** SpaceMember를 hard delete하고 알림용 recipientUserId, spaceName을 반환한다. */
  removeBandSpaceMember(spaceId: string, memberId: string, tx?: Prisma.TransactionClient): Promise<RemoveBandSpaceMemberRepositoryResult>;
}
