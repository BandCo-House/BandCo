import type { BandMemberRole, Prisma } from '../../../generated/prisma';
import type { CreatePlaceInput } from '../dto/create-place.dto';
import type { GetBandPlacesQuery } from '../dto/get-band-places-query.dto';
import type { UpdatePlaceInput } from '../dto/update-place.dto';
import type { CreatePlaceResult } from '../types/create-place-result.type';
import type { DeletePlaceResult } from '../types/delete-place-result.type';
import type { PlaceDetail } from '../types/place-detail.type';
import type { GetBandPlacesResult } from '../types/place-list.type';
import type { UpdatePlaceResult } from '../types/update-place-result.type';

export const PLACES_REPOSITORY = Symbol('PLACES_REPOSITORY');

export interface PlacesRepository {
  /**
   * 밴드 존재 여부를 확인하기 위해 삭제되지 않은 밴드를 조회한다.
   * Band 모델에는 deletedAt이 있으므로 반드시 deletedAt: null 조건을 포함한다.
   */
  findActiveBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /**
   * 요청자가 해당 밴드의 멤버인지 확인하기 위해 BandMember를 조회한다.
   */
  findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; role: BandMemberRole } | null>;

  /**
   * 새 장소를 생성하고 생성된 결과를 반환한다.
   */
  createPlace(bandId: string, input: CreatePlaceInput, tx?: Prisma.TransactionClient): Promise<CreatePlaceResult>;

  /**
   * 밴드 내 장소 목록을 커서 기반 페이지네이션으로 조회한다.
   * where__is_active 필터가 전달되면 해당 활성 상태만 반환한다.
   */
  findBandPlaces(bandId: string, query: GetBandPlacesQuery, tx?: Prisma.TransactionClient): Promise<GetBandPlacesResult>;

  /**
   * placeId로 단일 장소를 조회한다.
   * where__is_active 필터가 전달되면 해당 활성 상태만 반환한다.
   * 없거나 조건 불일치 시 null을 반환한다.
   */
  findPlaceById(placeId: string, isActive?: boolean, tx?: Prisma.TransactionClient): Promise<PlaceDetail | null>;

  /**
   * 권한 검증용으로 장소의 bandId를 포함해 조회한다.
   * isActive 상태와 무관하게 조회한다.
   */
  findPlaceForMutation(placeId: string, tx?: Prisma.TransactionClient): Promise<{ id: string; bandId: string; isActive: boolean } | null>;

  /**
   * 장소 정보를 부분 수정(PATCH)하고 수정된 결과를 반환한다.
   */
  updatePlace(placeId: string, input: UpdatePlaceInput, tx?: Prisma.TransactionClient): Promise<UpdatePlaceResult>;

  /**
   * 장소를 소프트 삭제한다. isActive를 false로 변경한다.
   */
  deletePlace(placeId: string, tx?: Prisma.TransactionClient): Promise<DeletePlaceResult>;
}
