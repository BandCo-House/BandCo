import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
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

const BAND_NOT_FOUND_MESSAGE = '요청한 밴드를 찾을 수 없습니다.';
const SPACE_NOT_FOUND_MESSAGE = '요청한 합주 공간을 찾을 수 없습니다.';
const NOT_BAND_MEMBER_MESSAGE = '해당 밴드의 멤버가 아닙니다.';

@Injectable()
export class BandSpacesService {
  constructor(
    @Inject(BAND_SPACES_REPOSITORY) private readonly bandSpacesRepository: BandSpacesRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 밴드 멤버가 요청한 합주 공간을 생성한다. 요청자가 생성자이자 LEADER 멤버가 된다.
   * 밴드가 없으면 404, 요청자가 밴드 멤버가 아니면 403.
   */
  async createBandSpace(bandId: string, userId: string, input: CreateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<CreateBandSpaceResult> {
    const result = await this.runInTransaction(tx, async client => {
      const requesterBandMemberId = await this.resolveBandMemberId(bandId, userId, client);
      return this.bandSpacesRepository.createBandSpace(bandId, requesterBandMemberId, input, client);
    });

    const memberUserIds = await this.bandSpacesRepository.findBandMemberUserIds(bandId, tx);

    if (memberUserIds.length > 0) {
      await this.notificationsService.createManyNotifications(
        memberUserIds.map(memberUserId => ({
          userId: memberUserId,
          type: NotificationType.NOTICE,
          title: '새 합주 공간이 생성되었습니다',
          description: result.name,
          targetPath: `/bandspaces/${result.spaceId}`,
        })),
      );
    }

    return result;
  }

  /** 밴드 멤버에게 합주 공간 목록을 돌려준다. isMine·onlyMine·myMembership은 요청자 기준이다. */
  async getBandSpaces(bandId: string, userId: string, query: GetBandSpacesQuery, tx?: Prisma.TransactionClient): Promise<GetBandSpacesResult> {
    const requesterBandMemberId = await this.resolveBandMemberId(bandId, userId, tx);

    return this.bandSpacesRepository.findBandSpaces(bandId, requesterBandMemberId, query, tx);
  }

  async getBandSpaceDetail(spaceId: string, userId: string, tx?: Prisma.TransactionClient): Promise<GetBandSpaceDetailResult> {
    await this.assertSpaceBandMember(spaceId, userId, tx);

    const spaceDetail = await this.bandSpacesRepository.findDetailByBandSpaceId(spaceId, tx);

    if (spaceDetail === undefined) {
      throw new NotFoundException(SPACE_NOT_FOUND_MESSAGE);
    }

    return spaceDetail;
  }

  async updateBandSpace(spaceId: string, userId: string, input: UpdateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<UpdateBandSpaceResult> {
    return this.runInTransaction(tx, async client => {
      await this.assertSpaceBandMember(spaceId, userId, client);
      return this.bandSpacesRepository.updateBandSpace(spaceId, input, client);
    });
  }

  async deleteBandSpace(spaceId: string, userId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandSpaceResult> {
    return this.runInTransaction(tx, async client => {
      await this.assertSpaceBandMember(spaceId, userId, client);
      return this.bandSpacesRepository.deleteBandSpace(spaceId, client);
    });
  }

  async addBandSpaceMember(
    spaceId: string,
    userId: string,
    input: AddBandSpaceMemberInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AddBandSpaceMemberResult> {
    const {
      spaceName,
      userId: addedUserId,
      ...result
    } = await this.runInTransaction(tx, async client => {
      await this.assertSpaceBandMember(spaceId, userId, client);
      return this.bandSpacesRepository.addBandSpaceMember(spaceId, input, client);
    });

    await this.notificationsService.createNotification({
      userId: addedUserId,
      type: NotificationType.NOTICE,
      title: '합주 공간에 추가되었습니다',
      description: spaceName,
      targetPath: `/bandspaces/${spaceId}`,
    });

    return result;
  }

  async updateBandSpaceMemberRole(
    spaceId: string,
    userId: string,
    memberId: string,
    input: UpdateBandSpaceMemberRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateBandSpaceMemberRoleResult> {
    const { spaceName, ...result } = await this.runInTransaction(tx, async client => {
      await this.assertSpaceBandMember(spaceId, userId, client);
      return this.bandSpacesRepository.updateBandSpaceMemberRole(spaceId, memberId, input, client);
    });

    await this.notificationsService.createNotification({
      userId: result.userId,
      type: NotificationType.NOTICE,
      title: '합주 공간에서 역할이 변경되었습니다',
      description: spaceName,
      targetPath: `/bandspaces/${spaceId}`,
    });

    return result;
  }

  async removeBandSpaceMember(
    spaceId: string,
    userId: string,
    memberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RemoveBandSpaceMemberResult> {
    const { recipientUserId, spaceName, ...result } = await this.runInTransaction(tx, async client => {
      await this.assertSpaceBandMember(spaceId, userId, client);
      return this.bandSpacesRepository.removeBandSpaceMember(spaceId, memberId, client);
    });

    await this.notificationsService.createNotification({
      userId: recipientUserId,
      type: NotificationType.NOTICE,
      title: '합주 공간에서 제거되었습니다',
      description: spaceName,
    });

    return result;
  }

  /** 외부 tx가 있으면 그대로 쓰고, 없으면 새 트랜잭션을 연다. */
  private runInTransaction<T>(tx: Prisma.TransactionClient | undefined, run: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /** 밴드가 있는지(404) 확인한 뒤 요청자의 밴드 멤버 id를 돌려준다(멤버가 아니면 403). */
  private async resolveBandMemberId(bandId: string, userId: string, client?: Prisma.TransactionClient): Promise<string> {
    const band = await this.bandSpacesRepository.findBandById(bandId, client);

    if (band === null) {
      throw new NotFoundException(BAND_NOT_FOUND_MESSAGE);
    }

    return this.resolveMembership(bandId, userId, client);
  }

  /** 공간이 있는지(404) 확인한 뒤 요청자가 그 공간이 속한 밴드의 멤버인지(403) 확인한다. */
  private async assertSpaceBandMember(spaceId: string, userId: string, client?: Prisma.TransactionClient): Promise<void> {
    const bandId = await this.bandSpacesRepository.findBandIdBySpaceId(spaceId, client);

    if (bandId === null) {
      throw new NotFoundException(SPACE_NOT_FOUND_MESSAGE);
    }

    await this.resolveMembership(bandId, userId, client);
  }

  private async resolveMembership(bandId: string, userId: string, client?: Prisma.TransactionClient): Promise<string> {
    const bandMember = await this.bandSpacesRepository.findBandMemberByBandIdAndUserId(bandId, userId, client);

    if (bandMember === null) {
      throw new ForbiddenException(NOT_BAND_MEMBER_MESSAGE);
    }

    return bandMember.id;
  }
}
