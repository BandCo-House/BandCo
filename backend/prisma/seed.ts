import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const seedIds = {
  users: {
    minjun: '10000000-0000-0000-0000-000000000001',
    seoyeon: '10000000-0000-0000-0000-000000000002',
    jiho: '10000000-0000-0000-0000-000000000003',
  },
  band: '20000000-0000-0000-0000-000000000001',
  place: '30000000-0000-0000-0000-000000000001',
  spaces: {
    summerShow: '40000000-0000-0000-0000-000000000001',
    acousticSession: '40000000-0000-0000-0000-000000000002',
  },
  spaceMembers: {
    summerLeader: '50000000-0000-0000-0000-000000000001',
    summerMember: '50000000-0000-0000-0000-000000000002',
    acousticLeader: '50000000-0000-0000-0000-000000000003',
    acousticMember: '50000000-0000-0000-0000-000000000004',
  },
  songs: {
    first: '60000000-0000-0000-0000-000000000001',
    second: '60000000-0000-0000-0000-000000000002',
    third: '60000000-0000-0000-0000-000000000003',
  },
  schedules: {
    summerPractice: '70000000-0000-0000-0000-000000000001',
    summerMeeting: '70000000-0000-0000-0000-000000000002',
    acousticPractice: '70000000-0000-0000-0000-000000000003',
  },
  teams: {
    summerMain: '80000000-0000-0000-0000-000000000001',
    acousticUnit: '80000000-0000-0000-0000-000000000002',
  },
  teamSongs: {
    summerFirst: '90000000-0000-0000-0000-000000000001',
    summerSecond: '90000000-0000-0000-0000-000000000002',
    summerThird: '90000000-0000-0000-0000-000000000003',
    acousticFirst: '90000000-0000-0000-0000-000000000004',
  },
  bandMembers: {
    minjun: 'a0000000-0000-0000-0000-000000000001',
    seoyeon: 'a0000000-0000-0000-0000-000000000002',
    jiho: 'a0000000-0000-0000-0000-000000000003',
  },
  userProfiles: {
    minjun: '10000000-0000-0000-0000-000000000001',
    seoyeon: '10000000-0000-0000-0000-000000000002',
    jiho: '10000000-0000-0000-0000-000000000003',
  },
} as const;

/**
 * spaces API를 빠르게 확인할 수 있도록 필요한 관계만 고정 ID로 다시 채운다.
 *
 * @returns {Promise<void>} 시드 데이터 입력 완료
 */
async function main(): Promise<void> {
  await deleteSeedData();
  await insertSeedData();

  console.info('Jamplay spaces seed inserted.');
  console.info(`Band ID: ${seedIds.band}`);
  console.info(`Space ID (summer): ${seedIds.spaces.summerShow}`);
  console.info(`Space ID (acoustic): ${seedIds.spaces.acousticSession}`);
}

/**
 * 같은 시드를 여러 번 실행해도 결과가 같아야 테스트가 흔들리지 않는다.
 *
 * @returns {Promise<void>} 기존 시드 데이터 정리 완료
 */
async function deleteSeedData(): Promise<void> {
  await prisma.teamSong.deleteMany({
    where: {
      id: {
        in: Object.values(seedIds.teamSongs),
      },
    },
  });
  await prisma.team.deleteMany({
    where: {
      id: {
        in: Object.values(seedIds.teams),
      },
    },
  });
  await prisma.schedule.deleteMany({
    where: {
      id: {
        in: Object.values(seedIds.schedules),
      },
    },
  });
  await prisma.spaceMember.deleteMany({
    where: {
      id: {
        in: Object.values(seedIds.spaceMembers),
      },
    },
  });
  await prisma.bandSpace.deleteMany({
    where: {
      id: {
        in: Object.values(seedIds.spaces),
      },
    },
  });
  await prisma.song.deleteMany({
    where: {
      id: {
        in: Object.values(seedIds.songs),
      },
    },
  });
  await prisma.place.deleteMany({
    where: {
      id: seedIds.place,
    },
  });
  await prisma.bandMember.deleteMany({
    where: {
      id: {
        in: Object.values(seedIds.bandMembers),
      },
    },
  });
  await prisma.userProfile.deleteMany({
    where: {
      userId: {
        in: Object.values(seedIds.userProfiles),
      },
    },
  });
  await prisma.band.deleteMany({
    where: {
      id: seedIds.band,
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: Object.values(seedIds.users),
      },
    },
  });
}

/**
 * 목록과 상세 조회에 필요한 사용자, 공간, 일정, 곡 관계를 한 번에 구성한다.
 *
 * @returns {Promise<void>} 시드 데이터 생성 완료
 */
async function insertSeedData(): Promise<void> {
  await prisma.user.createMany({
    data: [
      {
        id: seedIds.users.minjun,
        email: 'minjun@jamplay.local',
        status: 'ACTIVE',
      },
      {
        id: seedIds.users.seoyeon,
        email: 'seoyeon@jamplay.local',
        status: 'ACTIVE',
      },
      {
        id: seedIds.users.jiho,
        email: 'jiho@jamplay.local',
        status: 'ACTIVE',
      },
    ],
  });

  await prisma.userProfile.createMany({
    data: [
      {
        userId: seedIds.userProfiles.minjun,
        nickname: '김민준',
        selfDescription: '보컬과 밴드 운영을 맡고 있다.',
      },
      {
        userId: seedIds.userProfiles.seoyeon,
        nickname: '이서연',
        selfDescription: '어쿠스틱 편곡과 건반을 담당한다.',
      },
      {
        userId: seedIds.userProfiles.jiho,
        nickname: '박지호',
        selfDescription: '드럼과 일정 조율을 맡고 있다.',
      },
    ],
  });

  await prisma.band.create({
    data: {
      id: seedIds.band,
      name: '홍대 인디 밴드',
      bandMasterUserId: seedIds.users.minjun,
      description: 'spaces API 확인용 더미 밴드',
      visibility: true,
      inviteCode: 'SPACE-SEED',
    },
  });

  await prisma.bandMember.createMany({
    data: [
      {
        id: seedIds.bandMembers.minjun,
        bandId: seedIds.band,
        userId: seedIds.users.minjun,
        role: 'BM',
      },
      {
        id: seedIds.bandMembers.seoyeon,
        bandId: seedIds.band,
        userId: seedIds.users.seoyeon,
        role: 'ADMIN',
      },
      {
        id: seedIds.bandMembers.jiho,
        bandId: seedIds.band,
        userId: seedIds.users.jiho,
        role: 'MEMBER',
      },
    ],
  });

  await prisma.place.create({
    data: {
      id: seedIds.place,
      bandId: seedIds.band,
      name: '합정 연습실 A',
      address: '서울 마포구 양화로 12',
      detailAddress: '지하 1층 A룸',
      isActive: true,
    },
  });

  await prisma.bandSpace.createMany({
    data: [
      {
        id: seedIds.spaces.summerShow,
        bandId: seedIds.band,
        name: '2026 하계공연 준비',
        description: '여름 축제 무대를 위한 메인 합주 공간',
        spaceType: 'STUDIO',
        status: 'ACTIVE',
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2026-08-20T00:00:00.000Z'),
        createdByUserId: seedIds.users.minjun,
        createdAt: new Date('2026-02-18T10:20:30.000Z'),
        updatedAt: new Date('2026-02-20T12:00:00.000Z'),
      },
      {
        id: seedIds.spaces.acousticSession,
        bandId: seedIds.band,
        name: '봄 정기공연 어쿠스틱 세션',
        description: '소규모 편성으로 편곡을 맞추는 공간',
        spaceType: 'PRACTICE_ROOM',
        status: 'ACTIVE',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: new Date('2026-03-25T00:00:00.000Z'),
        createdByUserId: seedIds.users.seoyeon,
        createdAt: new Date('2026-02-25T08:00:00.000Z'),
        updatedAt: new Date('2026-02-28T09:30:00.000Z'),
      },
    ],
  });

  await prisma.spaceMember.createMany({
    data: [
      {
        id: seedIds.spaceMembers.summerLeader,
        spaceId: seedIds.spaces.summerShow,
        userId: seedIds.users.minjun,
        role: 'LEADER',
        status: 'ACTIVE',
        joinedAt: new Date('2026-02-18T10:21:00.000Z'),
      },
      {
        id: seedIds.spaceMembers.summerMember,
        spaceId: seedIds.spaces.summerShow,
        userId: seedIds.users.jiho,
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: new Date('2026-02-18T10:22:00.000Z'),
      },
      {
        id: seedIds.spaceMembers.acousticLeader,
        spaceId: seedIds.spaces.acousticSession,
        userId: seedIds.users.seoyeon,
        role: 'LEADER',
        status: 'ACTIVE',
        joinedAt: new Date('2026-02-25T08:10:00.000Z'),
      },
      {
        id: seedIds.spaceMembers.acousticMember,
        spaceId: seedIds.spaces.acousticSession,
        userId: seedIds.users.minjun,
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: new Date('2026-02-25T08:12:00.000Z'),
      },
    ],
  });

  await prisma.song.createMany({
    data: [
      {
        id: seedIds.songs.first,
        bandId: seedIds.band,
        title: 'Summer Light',
        artistName: 'Jamplay',
        key: 'G',
        bpm: 118,
        createdByUserId: seedIds.users.minjun,
      },
      {
        id: seedIds.songs.second,
        bandId: seedIds.band,
        title: 'Acoustic Bloom',
        artistName: 'Jamplay',
        key: 'C',
        bpm: 92,
        createdByUserId: seedIds.users.seoyeon,
      },
      {
        id: seedIds.songs.third,
        bandId: seedIds.band,
        title: 'Night Ride',
        artistName: 'Jamplay',
        key: 'D',
        bpm: 132,
        createdByUserId: seedIds.users.jiho,
      },
    ],
  });

  await prisma.schedule.createMany({
    data: [
      {
        id: seedIds.schedules.summerPractice,
        bandSpaceId: seedIds.spaces.summerShow,
        placeId: seedIds.place,
        title: '메인 셋리스트 합주',
        scheduleType: 'PRACTICE',
        startAt: new Date('2026-08-03T10:00:00.000Z'),
        endAt: new Date('2026-08-03T13:00:00.000Z'),
        memo: '오프닝 두 곡 집중 점검',
        status: 'SCHEDULED',
        createdByUserId: seedIds.users.minjun,
      },
      {
        id: seedIds.schedules.summerMeeting,
        bandSpaceId: seedIds.spaces.summerShow,
        placeId: seedIds.place,
        title: '무대 동선 미팅',
        scheduleType: 'MEETING',
        startAt: new Date('2026-08-05T11:00:00.000Z'),
        endAt: new Date('2026-08-05T12:00:00.000Z'),
        memo: '무대 진입 동선과 장비 체크',
        status: 'SCHEDULED',
        createdByUserId: seedIds.users.minjun,
      },
      {
        id: seedIds.schedules.acousticPractice,
        bandSpaceId: seedIds.spaces.acousticSession,
        placeId: seedIds.place,
        title: '어쿠스틱 편곡 리허설',
        scheduleType: 'PRACTICE',
        startAt: new Date('2026-03-05T19:00:00.000Z'),
        endAt: new Date('2026-03-05T21:00:00.000Z'),
        memo: '키 변경과 코러스 정리',
        status: 'SCHEDULED',
        createdByUserId: seedIds.users.seoyeon,
      },
    ],
  });

  await prisma.team.createMany({
    data: [
      {
        id: seedIds.teams.summerMain,
        bandId: seedIds.band,
        name: '하계공연 메인팀',
        targetScheduleId: seedIds.schedules.summerPractice,
        note: '여름 축제 메인 셋리스트 팀',
        status: 'ACTIVE',
        teamLeaderUserId: seedIds.users.minjun,
      },
      {
        id: seedIds.teams.acousticUnit,
        bandId: seedIds.band,
        name: '어쿠스틱 유닛',
        targetScheduleId: seedIds.schedules.acousticPractice,
        note: '소극장 편성 어쿠스틱 팀',
        status: 'ACTIVE',
        teamLeaderUserId: seedIds.users.seoyeon,
      },
    ],
  });

  await prisma.teamSong.createMany({
    data: [
      {
        id: seedIds.teamSongs.summerFirst,
        teamId: seedIds.teams.summerMain,
        songId: seedIds.songs.first,
      },
      {
        id: seedIds.teamSongs.summerSecond,
        teamId: seedIds.teams.summerMain,
        songId: seedIds.songs.second,
      },
      {
        id: seedIds.teamSongs.summerThird,
        teamId: seedIds.teams.summerMain,
        songId: seedIds.songs.third,
      },
      {
        id: seedIds.teamSongs.acousticFirst,
        teamId: seedIds.teams.acousticUnit,
        songId: seedIds.songs.second,
      },
    ],
  });
}

main()
  .catch(async error => {
    console.error('Jamplay spaces seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
