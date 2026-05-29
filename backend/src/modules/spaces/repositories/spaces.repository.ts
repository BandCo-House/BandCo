import type { Prisma } from '../../../generated/prisma';
import type { AddSpaceMemberInput } from '../dto/add-space-member.dto';
import type { CreateBandSpaceInput } from '../dto/create-band-space.dto';
import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { UpdateBandSpaceInput } from '../dto/update-band-space.dto';
import type { UpdateSpaceMemberRoleInput } from '../dto/update-space-member-role.dto';
import type { AddSpaceMemberResult } from '../types/add-space-member-result.type';
import type { GetBandSpacesResult } from '../types/band-space-list-item.type';
import type { CreateBandSpaceResult } from '../types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from '../types/delete-band-space-result.type';
import type { RemoveSpaceMemberResult } from '../types/remove-space-member-result.type';
import type { GetSpaceDetailResult } from '../types/space-detail.type';
import type { UpdateBandSpaceResult } from '../types/update-band-space-result.type';
import type { UpdateSpaceMemberRoleResult } from '../types/update-space-member-role-result.type';

export const SPACES_REPOSITORY = Symbol('SPACES_REPOSITORY');

/** addSpaceMember 저장소 반환 타입. spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
export interface AddSpaceMemberRepositoryResult extends AddSpaceMemberResult {
  spaceName: string;
}

/** updateSpaceMemberRole 저장소 반환 타입. spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
export interface UpdateSpaceMemberRoleRepositoryResult extends UpdateSpaceMemberRoleResult {
  spaceName: string;
}

/** removeSpaceMember 저장소 반환 타입. recipientUserId, spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
export interface RemoveSpaceMemberRepositoryResult extends RemoveSpaceMemberResult {
  recipientUserId: string;
  spaceName: string;
}

export interface SpacesRepository {
  addSpaceMember(spaceId: string, input: AddSpaceMemberInput, tx?: Prisma.TransactionClient): Promise<AddSpaceMemberRepositoryResult>;
  createBandSpace(bandId: string, input: CreateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<CreateBandSpaceResult>;
  findBandSpaces(bandId: string, query: GetBandSpacesQuery, tx?: Prisma.TransactionClient): Promise<GetBandSpacesResult>;
  findDetailBySpaceId(spaceId: string, tx?: Prisma.TransactionClient): Promise<GetSpaceDetailResult | undefined>;
  findBandMemberUserIds(bandId: string, tx?: Prisma.TransactionClient): Promise<string[]>;
  updateBandSpace(spaceId: string, input: UpdateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<UpdateBandSpaceResult>;
  deleteBandSpace(spaceId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandSpaceResult>;
  updateSpaceMemberRole(
    spaceId: string,
    memberId: string,
    input: UpdateSpaceMemberRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateSpaceMemberRoleRepositoryResult>;
  removeSpaceMember(spaceId: string, memberId: string, tx?: Prisma.TransactionClient): Promise<RemoveSpaceMemberRepositoryResult>;
}
