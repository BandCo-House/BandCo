import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationType } from '../../generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';

import type { AddSpaceMemberInput } from './dto/add-space-member.dto';
import type { CreateBandSpaceInput } from './dto/create-band-space.dto';
import type { GetBandSpacesQuery } from './dto/get-band-spaces-query.dto';
import type { UpdateBandSpaceInput } from './dto/update-band-space.dto';
import { SPACES_REPOSITORY, type SpacesRepository } from './repositories/spaces.repository';
import type { AddSpaceMemberResult } from './types/add-space-member-result.type';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { CreateBandSpaceResult } from './types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from './types/delete-band-space-result.type';
import type { GetSpaceDetailResult } from './types/space-detail.type';
import type { UpdateBandSpaceResult } from './types/update-band-space-result.type';

@Injectable()
export class SpacesService {
  constructor(
    @Inject(SPACES_REPOSITORY) private readonly spacesRepository: SpacesRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async addSpaceMember(spaceId: string, input: AddSpaceMemberInput): Promise<AddSpaceMemberResult> {
    const { spaceName, ...result } = await this.spacesRepository.addSpaceMember(spaceId, input);

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
    const result = await this.spacesRepository.createBandSpace(bandId, input);

    const memberUserIds = await this.spacesRepository.findBandMemberUserIds(bandId);

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
    return this.spacesRepository.findBandSpaces(bandId, query);
  }

  async getSpaceDetail(spaceId: string): Promise<GetSpaceDetailResult> {
    const spaceDetail = await this.spacesRepository.findDetailBySpaceId(spaceId);

    if (spaceDetail === undefined) {
      throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
    }

    return spaceDetail;
  }

  async updateBandSpace(spaceId: string, input: UpdateBandSpaceInput): Promise<UpdateBandSpaceResult> {
    return this.spacesRepository.updateBandSpace(spaceId, input);
  }

  async deleteBandSpace(spaceId: string): Promise<DeleteBandSpaceResult> {
    return this.spacesRepository.deleteBandSpace(spaceId);
  }
}
