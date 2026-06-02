import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationType } from '../../generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';

import type { AddBandSpaceMemberInput } from './dto/add-bandspace-member.dto';
import type { CreateBandSpaceInput } from './dto/create-band-space.dto';
import type { GetBandSpacesQuery } from './dto/get-band-spaces-query.dto';
import type { UpdateBandSpaceInput } from './dto/update-band-space.dto';
import type { UpdateBandSpaceMemberRoleInput } from './dto/update-bandspace-member-role.dto';
import { BAND_SPACES_REPOSITORY, type BandSpacesRepository } from './repositories/bandspaces.repository';
import type { AddBandSpaceMemberResult } from './types/add-bandspace-member-result.type';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { GetBandSpaceDetailResult } from './types/bandspace-detail.type';
import type { CreateBandSpaceResult } from './types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from './types/delete-band-space-result.type';
import type { RemoveBandSpaceMemberResult } from './types/remove-bandspace-member-result.type';
import type { UpdateBandSpaceResult } from './types/update-band-space-result.type';
import type { UpdateBandSpaceMemberRoleResult } from './types/update-bandspace-member-role-result.type';

@Injectable()
export class BandSpacesService {
  constructor(
    @Inject(BAND_SPACES_REPOSITORY) private readonly bandSpacesRepository: BandSpacesRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async addBandSpaceMember(spaceId: string, input: AddBandSpaceMemberInput): Promise<AddBandSpaceMemberResult> {
    const { spaceName, ...result } = await this.bandSpacesRepository.addBandSpaceMember(spaceId, input);

    await this.notificationsService.createNotification({
      userId: result.userId,
      type: NotificationType.NOTICE,
      title: '합주 공간에 추가되었습니다',
      description: spaceName,
      targetPath: `/bandspaces/${spaceId}`,
    });

    return result;
  }

  async createBandSpace(bandId: string, input: CreateBandSpaceInput): Promise<CreateBandSpaceResult> {
    const result = await this.bandSpacesRepository.createBandSpace(bandId, input);

    const memberUserIds = await this.bandSpacesRepository.findBandMemberUserIds(bandId);

    if (memberUserIds.length > 0) {
      await this.notificationsService.createManyNotifications(
        memberUserIds.map(userId => ({
          userId,
          type: NotificationType.NOTICE,
          title: '새 합주 공간이 생성되었습니다',
          description: result.name,
          targetPath: `/bandspaces/${result.spaceId}`,
        })),
      );
    }

    return result;
  }

  async getBandSpaces(bandId: string, query: GetBandSpacesQuery): Promise<GetBandSpacesResult> {
    return this.bandSpacesRepository.findBandSpaces(bandId, query);
  }

  async getBandSpaceDetail(spaceId: string): Promise<GetBandSpaceDetailResult> {
    const spaceDetail = await this.bandSpacesRepository.findDetailByBandSpaceId(spaceId);

    if (spaceDetail === undefined) {
      throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
    }

    return spaceDetail;
  }

  async updateBandSpace(spaceId: string, input: UpdateBandSpaceInput): Promise<UpdateBandSpaceResult> {
    return this.bandSpacesRepository.updateBandSpace(spaceId, input);
  }

  async deleteBandSpace(spaceId: string): Promise<DeleteBandSpaceResult> {
    return this.bandSpacesRepository.deleteBandSpace(spaceId);
  }

  async updateBandSpaceMemberRole(
    spaceId: string,
    memberId: string,
    input: UpdateBandSpaceMemberRoleInput,
  ): Promise<UpdateBandSpaceMemberRoleResult> {
    const { spaceName, ...result } = await this.bandSpacesRepository.updateBandSpaceMemberRole(spaceId, memberId, input);

    await this.notificationsService.createNotification({
      userId: result.userId,
      type: NotificationType.NOTICE,
      title: '합주 공간에서 역할이 변경되었습니다',
      description: spaceName,
      targetPath: `/bandspaces/${spaceId}`,
    });

    return result;
  }

  async removeBandSpaceMember(spaceId: string, memberId: string): Promise<RemoveBandSpaceMemberResult> {
    const { recipientUserId, spaceName, ...result } = await this.bandSpacesRepository.removeBandSpaceMember(spaceId, memberId);

    await this.notificationsService.createNotification({
      userId: recipientUserId,
      type: NotificationType.NOTICE,
      title: '합주 공간에서 제거되었습니다',
      description: spaceName,
    });

    return result;
  }
}
