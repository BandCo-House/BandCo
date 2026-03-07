import { Injectable } from '@nestjs/common';

import type { BandSpaceListItem } from '../types/band-space-list-item.type';
import type { GetSpaceDetailResult } from '../types/space-detail.type';

@Injectable()
export class SpacesMockRepository {
  private readonly spaces: BandSpaceListItem[] = [
    {
      spaceId: 'space-001',
      bandId: 'band-001',
      createdByUserId: 'user-001',
      name: '2026 하계공연 준비',
      description: '여름 축제 공연 준비 팀',
      spaceType: 'STUDIO',
      status: 'ACTIVE',
      startDate: '2026-08-01',
      endDate: '2026-08-20',
      memberCount: 10,
      songCount: 12,
      isMine: true,
      myMembership: {
        isMember: true,
        role: 'LEADER',
      },
      createdAt: '2026-02-18T10:20:30Z',
      updatedAt: '2026-02-20T12:00:00Z',
    },
    {
      spaceId: 'space-002',
      bandId: 'band-001',
      createdByUserId: 'user-002',
      name: '봄 정기공연 어쿠스틱 세션',
      description: '어쿠스틱 편성 연습 공간',
      spaceType: 'PRACTICE_ROOM',
      status: 'ACTIVE',
      startDate: '2026-03-01',
      endDate: '2026-03-25',
      memberCount: 5,
      songCount: 4,
      isMine: false,
      myMembership: {
        isMember: true,
        role: 'MEMBER',
      },
      createdAt: '2026-02-25T08:00:00Z',
      updatedAt: '2026-02-28T09:30:00Z',
    },
    {
      spaceId: 'space-003',
      bandId: 'band-002',
      createdByUserId: 'user-003',
      name: '온라인 편곡 회의',
      description: '원격으로 진행하는 편곡 논의 공간',
      spaceType: 'ONLINE',
      status: 'INACTIVE',
      startDate: '2026-04-01',
      endDate: '2026-04-10',
      memberCount: 3,
      songCount: 1,
      isMine: true,
      myMembership: {
        isMember: true,
        role: 'LEADER',
      },
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-02T10:00:00Z',
    },
  ];

  private readonly spaceDetails: GetSpaceDetailResult[] = [
    {
      space: {
        spaceId: 'space-001',
        bandId: 'band-001',
        name: '2026 하계공연 준비',
        description: '여름 축제 공연 준비 팀',
        spaceType: 'STUDIO',
        status: 'ACTIVE',
        startDate: '2026-08-01',
        endDate: '2026-08-20',
        createdAt: '2026-02-18T10:20:30Z',
        updatedAt: '2026-02-20T12:00:00Z',
      },
      members: [
        {
          userId: 'user-001',
          nickname: '김민준',
          role: 'LEADER',
          status: 'ACTIVE',
          joinedAt: '2026-02-18T10:21:00Z',
        },
        {
          userId: 'user-002',
          nickname: '이서연',
          role: 'MEMBER',
          status: 'ACTIVE',
          joinedAt: '2026-02-18T10:22:00Z',
        },
      ],
      songCount: 12,
      scheduleCount: 28,
    },
    {
      space: {
        spaceId: 'space-002',
        bandId: 'band-001',
        name: '봄 정기공연 어쿠스틱 세션',
        description: '어쿠스틱 편성 연습 공간',
        spaceType: 'PRACTICE_ROOM',
        status: 'ACTIVE',
        startDate: '2026-03-01',
        endDate: '2026-03-25',
        createdAt: '2026-02-25T08:00:00Z',
        updatedAt: '2026-02-28T09:30:00Z',
      },
      members: [
        {
          userId: 'user-002',
          nickname: '이서연',
          role: 'LEADER',
          status: 'ACTIVE',
          joinedAt: '2026-02-25T08:10:00Z',
        },
      ],
      songCount: 4,
      scheduleCount: 9,
    },
  ];

  findAll(): BandSpaceListItem[] {
    return this.spaces;
  }

  findDetailBySpaceId(spaceId: string): GetSpaceDetailResult | undefined {
    return this.spaceDetails.find(spaceDetail => spaceDetail.space.spaceId === spaceId);
  }
}
