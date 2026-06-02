import type { Prisma } from '../../../generated/prisma';
import type { AddSpaceMemberInput } from '../dto/add-space-member.dto';
import type { CreateBandSpaceInput } from '../dto/create-band-space.dto';
import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { UpdateBandSpaceInput } from '../dto/update-band-space.dto';
import type { AddSpaceMemberResult } from '../types/add-space-member-result.type';
import type { GetBandSpacesResult } from '../types/band-space-list-item.type';
import type { CreateBandSpaceResult } from '../types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from '../types/delete-band-space-result.type';
import type { GetSpaceDetailResult } from '../types/space-detail.type';
import type { UpdateBandSpaceResult } from '../types/update-band-space-result.type';

export const SPACES_REPOSITORY = Symbol('SPACES_REPOSITORY');

/** addSpaceMember 저장소 반환 타입. spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
export interface AddSpaceMemberRepositoryResult extends AddSpaceMemberResult {
  spaceName: string;
}

export interface SpacesRepository {
  addSpaceMember(spaceId: string, input: AddSpaceMemberInput, tx?: Prisma.TransactionClient): Promise<AddSpaceMemberRepositoryResult>;
  createBandSpace(bandId: string, input: CreateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<CreateBandSpaceResult>;
  findBandSpaces(bandId: string, query: GetBandSpacesQuery, tx?: Prisma.TransactionClient): Promise<GetBandSpacesResult>;
  findDetailBySpaceId(spaceId: string, tx?: Prisma.TransactionClient): Promise<GetSpaceDetailResult | undefined>;
  /** 밴드 멤버 전체의 userId 배열을 반환한다. 공간 생성 시 알림 수신자 조회에 사용한다. */
  findBandMemberUserIds(bandId: string, tx?: Prisma.TransactionClient): Promise<string[]>;
  /** 전달된 필드만 업데이트한다 (PATCH 패턴). */
  updateBandSpace(spaceId: string, input: UpdateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<UpdateBandSpaceResult>;
  /** deletedAt을 현재 시각으로 설정한다 (soft delete). */
  deleteBandSpace(spaceId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandSpaceResult>;
}
