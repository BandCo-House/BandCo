import { getConflictingSeedUserIds, type SeedUserDefinition } from '../src/database/prisma/seed-user-conflict.util';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const seedIds = {
  users: {
    minjun: '11111111-1111-1111-1111-111111111111',
    seoyeon: '22222222-2222-2222-2222-222222222222',
    jiho: '33333333-3333-3333-3333-333333333333',
  },
  band: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  place: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  spaces: {
    summerShow: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    acousticSession: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  },
  schedules: {
    summerPractice: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    summerMeeting: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    acousticPractice: '99999999-9999-9999-9999-999999999999',
  },
  teams: {
    summerMain: 'abababab-abab-abab-abab-abababababab',
    acousticUnit: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd',
  },
  songs: {
    first: '12121212-1212-1212-1212-121212121212',
    second: '34343434-3434-3434-3434-343434343434',
    third: '56565656-5656-5656-5656-565656565656',
  },
  bandMembers: {
    minjun: '78787878-7878-7878-7878-787878787878',
    seoyeon: '89898989-8989-8989-8989-898989898989',
    jiho: '90909090-9090-9090-9090-909090909090',
  },
  spaceMembers: {
    summerLeader: 'abab1212-abab-1212-abab-1212abab1212',
    summerMember: 'cdcd3434-cdcd-3434-cdcd-3434cdcd3434',
    acousticLeader: 'efef5656-efef-5656-efef-5656efef5656',
    acousticMember: '1212abab-1212-abab-1212-abab1212abab',
  },
  scheduleParticipants: {
    summerLeader: '3434cdcd-3434-cdcd-3434-cdcd3434cdcd',
    summerMember: '5656efef-5656-efef-5656-efef5656efef',
    meetingLeader: '7878abab-7878-abab-7878-abab7878abab',
    acousticLeader: '9090cdcd-9090-cdcd-9090-cdcd9090cdcd',
  },
  teamMembers: {
    summerLeader: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    summerMember: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
    acousticLeader: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
  },
  teamSongs: {
    summerFirst: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    summerSecond: 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5',
    summerThird: 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
    acousticSecond: '17171717-1717-1717-1717-171717171717',
  },
  notifications: {
    invite: '18181818-1818-1818-1818-181818181818',
    notice: '19191919-1919-1919-1919-191919191919',
    reminder: '20202020-2020-2020-2020-202020202020',
  },
} as const;

const seedUsers: readonly SeedUserDefinition[] = [
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
] as const;

/**
 * 로컬 개발 환경에서 바로 화면과 API를 확인할 수 있도록
 * 최소한의 데모 데이터를 고정 ID로 채운다.
 *
 * @returns {Promise<void>} 시드 데이터 생성이 끝나면 완료된다.
 */
async function seedLocalDemoData(): Promise<void> {
  await upsertUsers();
  await upsertProfiles();
  await upsertBand();
  await upsertBandMembers();
  await upsertPlace();
  await upsertSpaces();
  await upsertSpaceMembers();
  await upsertSongs();
  await upsertSchedules();
  await upsertScheduleParticipants();
  await upsertTeams();
  await upsertTeamMembers();
  await upsertTeamSongs();
  await upsertNotifications();
}

/**
 * 로컬에서 공통으로 사용할 기본 사용자 데이터를 만든다.
 *
 * @returns {Promise<void>} 사용자 데이터가 준비되면 완료된다.
 */
async function upsertUsers(): Promise<void> {
  await clearEmailsFromConflictingUsers();

  for (const seedUser of seedUsers) {
    await prisma.user.upsert({
      where: { id: seedUser.id },
      update: {
        email: seedUser.email,
        status: seedUser.status,
      },
      create: {
        id: seedUser.id,
        email: seedUser.email,
        status: seedUser.status,
      },
    });
  }
}

/**
 * 이전 시드 실행이나 수동 데이터 입력으로 남아 있는 사용자 중에서
 * 현재 시드가 사용할 이메일과 같지만 ID가 다른 레코드의 이메일만 먼저 비운다.
 *
 * 시드는 다른 테이블에서 고정 사용자 ID를 참조하므로,
 * 기존 사용자를 삭제하면 FK 제약이 걸릴 수 있다.
 * 그래서 로컬 더미 데이터 시드에서는 참조 관계는 유지하고,
 * 이메일 유니크 충돌만 해소하는 방식으로 정리한다.
 *
 * @returns {Promise<void>} 이메일 충돌 정리가 끝나면 완료된다.
 */
async function clearEmailsFromConflictingUsers(): Promise<void> {
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: seedUsers.map(seedUser => seedUser.email),
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  const conflictingUserIds = getConflictingSeedUserIds({
    seedUsers,
    existingUsers,
  });

  if (conflictingUserIds.length === 0) {
    return;
  }

  await prisma.user.updateMany({
    where: {
      id: {
        in: conflictingUserIds,
      },
    },
    data: {
      email: null,
    },
  });
}

/**
 * 사용자 목록 화면에서 바로 식별할 수 있도록 프로필을 연결한다.
 *
 * @returns {Promise<void>} 프로필 데이터가 준비되면 완료된다.
 */
async function upsertProfiles(): Promise<void> {
  await prisma.userProfile.upsert({
    where: { userId: seedIds.users.minjun },
    update: {
      nickname: '김민준',
      selfDescription: '리드 기타와 밴드 운영을 맡고 있습니다.',
    },
    create: {
      userId: seedIds.users.minjun,
      nickname: '김민준',
      selfDescription: '리드 기타와 밴드 운영을 맡고 있습니다.',
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: seedIds.users.seoyeon },
    update: {
      nickname: '이서연',
      selfDescription: '어쿠스틱 편곡과 보컬을 담당합니다.',
    },
    create: {
      userId: seedIds.users.seoyeon,
      nickname: '이서연',
      selfDescription: '어쿠스틱 편곡과 보컬을 담당합니다.',
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: seedIds.users.jiho },
    update: {
      nickname: '박지호',
      selfDescription: '드럼과 리듬 파트를 정리합니다.',
    },
    create: {
      userId: seedIds.users.jiho,
      nickname: '박지호',
      selfDescription: '드럼과 리듬 파트를 정리합니다.',
    },
  });
}

/**
 * 시드 데이터의 기준이 되는 기본 밴드를 만든다.
 *
 * @returns {Promise<void>} 밴드 데이터가 준비되면 완료된다.
 */
async function upsertBand(): Promise<void> {
  await prisma.band.upsert({
    where: { id: seedIds.band },
    update: {
      name: 'Jamplay 밴드',
      description: '로컬 개발 확인용 더미 밴드',
      bandMasterUserId: seedIds.users.minjun,
    },
    create: {
      id: seedIds.band,
      name: 'Jamplay 밴드',
      description: '로컬 개발 확인용 더미 밴드',
      bandMasterUserId: seedIds.users.minjun,
    },
  });
}

/**
 * 밴드 멤버 관계를 고정 데이터로 만든다.
 *
 * @returns {Promise<void>} 밴드 멤버 데이터가 준비되면 완료된다.
 */
async function upsertBandMembers(): Promise<void> {
  await prisma.bandMember.upsert({
    where: { id: seedIds.bandMembers.minjun },
    update: {
      bandId: seedIds.band,
      userId: seedIds.users.minjun,
      role: 'BM',
    },
    create: {
      id: seedIds.bandMembers.minjun,
      bandId: seedIds.band,
      userId: seedIds.users.minjun,
      role: 'BM',
    },
  });

  await prisma.bandMember.upsert({
    where: { id: seedIds.bandMembers.seoyeon },
    update: {
      bandId: seedIds.band,
      userId: seedIds.users.seoyeon,
      role: 'MEMBER',
    },
    create: {
      id: seedIds.bandMembers.seoyeon,
      bandId: seedIds.band,
      userId: seedIds.users.seoyeon,
      role: 'MEMBER',
    },
  });

  await prisma.bandMember.upsert({
    where: { id: seedIds.bandMembers.jiho },
    update: {
      bandId: seedIds.band,
      userId: seedIds.users.jiho,
      role: 'MEMBER',
    },
    create: {
      id: seedIds.bandMembers.jiho,
      bandId: seedIds.band,
      userId: seedIds.users.jiho,
      role: 'MEMBER',
    },
  });
}

/**
 * 일정과 공간이 함께 참조할 기본 장소를 만든다.
 *
 * @returns {Promise<void>} 장소 데이터가 준비되면 완료된다.
 */
async function upsertPlace(): Promise<void> {
  await prisma.place.upsert({
    where: { id: seedIds.place },
    update: {
      bandId: seedIds.band,
      name: '연습실 A',
      address: '서울시 마포구 와우산로 00',
      detailAddress: '3층 301호',
      isActive: true,
    },
    create: {
      id: seedIds.place,
      bandId: seedIds.band,
      name: '연습실 A',
      address: '서울시 마포구 와우산로 00',
      detailAddress: '3층 301호',
      isActive: true,
    },
  });
}

/**
 * 합주 공간 목록과 상세 조회에서 바로 사용할 공간 데이터를 만든다.
 *
 * @returns {Promise<void>} 공간 데이터가 준비되면 완료된다.
 */
async function upsertSpaces(): Promise<void> {
  await prisma.bandSpace.upsert({
    where: { id: seedIds.spaces.summerShow },
    update: {
      bandId: seedIds.band,
      name: '2026 하계공연 준비',
      description: '여름 축제 공연 준비 팀',
      spaceType: 'STUDIO',
      status: 'ACTIVE',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-20'),
      createdByUserId: seedIds.users.minjun,
    },
    create: {
      id: seedIds.spaces.summerShow,
      bandId: seedIds.band,
      name: '2026 하계공연 준비',
      description: '여름 축제 공연 준비 팀',
      spaceType: 'STUDIO',
      status: 'ACTIVE',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-20'),
      createdByUserId: seedIds.users.minjun,
    },
  });

  await prisma.bandSpace.upsert({
    where: { id: seedIds.spaces.acousticSession },
    update: {
      bandId: seedIds.band,
      name: '봄 정기공연 어쿠스틱 세션',
      description: '어쿠스틱 편성 연습 공간',
      spaceType: 'PRACTICE_ROOM',
      status: 'ACTIVE',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-25'),
      createdByUserId: seedIds.users.seoyeon,
    },
    create: {
      id: seedIds.spaces.acousticSession,
      bandId: seedIds.band,
      name: '봄 정기공연 어쿠스틱 세션',
      description: '어쿠스틱 편성 연습 공간',
      spaceType: 'PRACTICE_ROOM',
      status: 'ACTIVE',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-25'),
      createdByUserId: seedIds.users.seoyeon,
    },
  });
}

/**
 * 공간 멤버 데이터를 만들어 목록과 상세 화면에서 관계를 확인할 수 있게 한다.
 *
 * @returns {Promise<void>} 공간 멤버 데이터가 준비되면 완료된다.
 */
async function upsertSpaceMembers(): Promise<void> {
  await prisma.spaceMember.upsert({
    where: { id: seedIds.spaceMembers.summerLeader },
    update: {
      spaceId: seedIds.spaces.summerShow,
      userId: seedIds.users.minjun,
      role: 'LEADER',
      status: 'ACTIVE',
    },
    create: {
      id: seedIds.spaceMembers.summerLeader,
      spaceId: seedIds.spaces.summerShow,
      userId: seedIds.users.minjun,
      role: 'LEADER',
      status: 'ACTIVE',
    },
  });

  await prisma.spaceMember.upsert({
    where: { id: seedIds.spaceMembers.summerMember },
    update: {
      spaceId: seedIds.spaces.summerShow,
      userId: seedIds.users.seoyeon,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
    create: {
      id: seedIds.spaceMembers.summerMember,
      spaceId: seedIds.spaces.summerShow,
      userId: seedIds.users.seoyeon,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  await prisma.spaceMember.upsert({
    where: { id: seedIds.spaceMembers.acousticLeader },
    update: {
      spaceId: seedIds.spaces.acousticSession,
      userId: seedIds.users.seoyeon,
      role: 'LEADER',
      status: 'ACTIVE',
    },
    create: {
      id: seedIds.spaceMembers.acousticLeader,
      spaceId: seedIds.spaces.acousticSession,
      userId: seedIds.users.seoyeon,
      role: 'LEADER',
      status: 'ACTIVE',
    },
  });

  await prisma.spaceMember.upsert({
    where: { id: seedIds.spaceMembers.acousticMember },
    update: {
      spaceId: seedIds.spaces.acousticSession,
      userId: seedIds.users.minjun,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
    create: {
      id: seedIds.spaceMembers.acousticMember,
      spaceId: seedIds.spaces.acousticSession,
      userId: seedIds.users.minjun,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });
}

/**
 * 곡 목록과 팀 연결 확인용 기본 곡 데이터를 만든다.
 *
 * @returns {Promise<void>} 곡 데이터가 준비되면 완료된다.
 */
async function upsertSongs(): Promise<void> {
  await prisma.song.upsert({
    where: { id: seedIds.songs.first },
    update: {
      bandId: seedIds.band,
      title: 'Summer Light',
      artistName: 'Jamplay',
      key: 'G',
      bpm: 118,
      createdByUserId: seedIds.users.minjun,
    },
    create: {
      id: seedIds.songs.first,
      bandId: seedIds.band,
      title: 'Summer Light',
      artistName: 'Jamplay',
      key: 'G',
      bpm: 118,
      createdByUserId: seedIds.users.minjun,
    },
  });

  await prisma.song.upsert({
    where: { id: seedIds.songs.second },
    update: {
      bandId: seedIds.band,
      title: 'Acoustic Bloom',
      artistName: 'Jamplay',
      key: 'C',
      bpm: 92,
      createdByUserId: seedIds.users.seoyeon,
    },
    create: {
      id: seedIds.songs.second,
      bandId: seedIds.band,
      title: 'Acoustic Bloom',
      artistName: 'Jamplay',
      key: 'C',
      bpm: 92,
      createdByUserId: seedIds.users.seoyeon,
    },
  });

  await prisma.song.upsert({
    where: { id: seedIds.songs.third },
    update: {
      bandId: seedIds.band,
      title: 'Night Ride',
      artistName: 'Jamplay',
      key: 'D',
      bpm: 132,
      createdByUserId: seedIds.users.jiho,
    },
    create: {
      id: seedIds.songs.third,
      bandId: seedIds.band,
      title: 'Night Ride',
      artistName: 'Jamplay',
      key: 'D',
      bpm: 132,
      createdByUserId: seedIds.users.jiho,
    },
  });
}

/**
 * 캘린더와 일정 상세 확인에 쓸 기본 일정을 만든다.
 *
 * @returns {Promise<void>} 일정 데이터가 준비되면 완료된다.
 */
async function upsertSchedules(): Promise<void> {
  await prisma.schedule.upsert({
    where: { id: seedIds.schedules.summerPractice },
    update: {
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
    create: {
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
  });

  await prisma.schedule.upsert({
    where: { id: seedIds.schedules.summerMeeting },
    update: {
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
    create: {
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
  });

  await prisma.schedule.upsert({
    where: { id: seedIds.schedules.acousticPractice },
    update: {
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
    create: {
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
  });
}

/**
 * 일정 참여 상태를 넣어 출석 관련 화면을 바로 붙일 수 있게 한다.
 *
 * @returns {Promise<void>} 일정 참여 데이터가 준비되면 완료된다.
 */
async function upsertScheduleParticipants(): Promise<void> {
  await prisma.scheduleParticipant.upsert({
    where: { id: seedIds.scheduleParticipants.summerLeader },
    update: {
      scheduleId: seedIds.schedules.summerPractice,
      userId: seedIds.users.minjun,
      attendanceStatus: 'ATTEND',
      note: '장비 세팅 30분 전 도착 예정',
    },
    create: {
      id: seedIds.scheduleParticipants.summerLeader,
      scheduleId: seedIds.schedules.summerPractice,
      userId: seedIds.users.minjun,
      attendanceStatus: 'ATTEND',
      note: '장비 세팅 30분 전 도착 예정',
    },
  });

  await prisma.scheduleParticipant.upsert({
    where: { id: seedIds.scheduleParticipants.summerMember },
    update: {
      scheduleId: seedIds.schedules.summerPractice,
      userId: seedIds.users.seoyeon,
      attendanceStatus: 'ATTEND',
      note: '어쿠스틱 기타 지참',
    },
    create: {
      id: seedIds.scheduleParticipants.summerMember,
      scheduleId: seedIds.schedules.summerPractice,
      userId: seedIds.users.seoyeon,
      attendanceStatus: 'ATTEND',
      note: '어쿠스틱 기타 지참',
    },
  });

  await prisma.scheduleParticipant.upsert({
    where: { id: seedIds.scheduleParticipants.meetingLeader },
    update: {
      scheduleId: seedIds.schedules.summerMeeting,
      userId: seedIds.users.minjun,
      attendanceStatus: 'ATTEND',
      note: '진행표 초안 공유 예정',
    },
    create: {
      id: seedIds.scheduleParticipants.meetingLeader,
      scheduleId: seedIds.schedules.summerMeeting,
      userId: seedIds.users.minjun,
      attendanceStatus: 'ATTEND',
      note: '진행표 초안 공유 예정',
    },
  });

  await prisma.scheduleParticipant.upsert({
    where: { id: seedIds.scheduleParticipants.acousticLeader },
    update: {
      scheduleId: seedIds.schedules.acousticPractice,
      userId: seedIds.users.seoyeon,
      attendanceStatus: 'ATTEND',
      note: '편곡 버전 최종 확인',
    },
    create: {
      id: seedIds.scheduleParticipants.acousticLeader,
      scheduleId: seedIds.schedules.acousticPractice,
      userId: seedIds.users.seoyeon,
      attendanceStatus: 'ATTEND',
      note: '편곡 버전 최종 확인',
    },
  });
}

/**
 * 팀과 일정 연결을 만들어 연습 단위 데이터를 함께 확인할 수 있게 한다.
 *
 * @returns {Promise<void>} 팀 데이터가 준비되면 완료된다.
 */
async function upsertTeams(): Promise<void> {
  await prisma.team.upsert({
    where: { id: seedIds.teams.summerMain },
    update: {
      bandId: seedIds.band,
      name: '하계공연 메인팀',
      targetScheduleId: seedIds.schedules.summerPractice,
      note: '여름 축제 메인 셋리스트 팀',
      status: 'ACTIVE',
      teamLeaderUserId: seedIds.users.minjun,
    },
    create: {
      id: seedIds.teams.summerMain,
      bandId: seedIds.band,
      name: '하계공연 메인팀',
      targetScheduleId: seedIds.schedules.summerPractice,
      note: '여름 축제 메인 셋리스트 팀',
      status: 'ACTIVE',
      teamLeaderUserId: seedIds.users.minjun,
    },
  });

  await prisma.team.upsert({
    where: { id: seedIds.teams.acousticUnit },
    update: {
      bandId: seedIds.band,
      name: '어쿠스틱 유닛',
      targetScheduleId: seedIds.schedules.acousticPractice,
      note: '소극장 편성 어쿠스틱 팀',
      status: 'ACTIVE',
      teamLeaderUserId: seedIds.users.seoyeon,
    },
    create: {
      id: seedIds.teams.acousticUnit,
      bandId: seedIds.band,
      name: '어쿠스틱 유닛',
      targetScheduleId: seedIds.schedules.acousticPractice,
      note: '소극장 편성 어쿠스틱 팀',
      status: 'ACTIVE',
      teamLeaderUserId: seedIds.users.seoyeon,
    },
  });
}

/**
 * 팀 멤버 구성을 넣어 팀 상세 확장에 대비한다.
 *
 * @returns {Promise<void>} 팀 멤버 데이터가 준비되면 완료된다.
 */
async function upsertTeamMembers(): Promise<void> {
  await prisma.teamMember.upsert({
    where: { id: seedIds.teamMembers.summerLeader },
    update: {
      teamId: seedIds.teams.summerMain,
      userId: seedIds.users.minjun,
    },
    create: {
      id: seedIds.teamMembers.summerLeader,
      teamId: seedIds.teams.summerMain,
      userId: seedIds.users.minjun,
    },
  });

  await prisma.teamMember.upsert({
    where: { id: seedIds.teamMembers.summerMember },
    update: {
      teamId: seedIds.teams.summerMain,
      userId: seedIds.users.jiho,
    },
    create: {
      id: seedIds.teamMembers.summerMember,
      teamId: seedIds.teams.summerMain,
      userId: seedIds.users.jiho,
    },
  });

  await prisma.teamMember.upsert({
    where: { id: seedIds.teamMembers.acousticLeader },
    update: {
      teamId: seedIds.teams.acousticUnit,
      userId: seedIds.users.seoyeon,
    },
    create: {
      id: seedIds.teamMembers.acousticLeader,
      teamId: seedIds.teams.acousticUnit,
      userId: seedIds.users.seoyeon,
    },
  });
}

/**
 * 곡과 팀 연결을 넣어 팀별 레퍼토리를 바로 확인할 수 있게 한다.
 *
 * @returns {Promise<void>} 팀-곡 연결 데이터가 준비되면 완료된다.
 */
async function upsertTeamSongs(): Promise<void> {
  await prisma.teamSong.upsert({
    where: { id: seedIds.teamSongs.summerFirst },
    update: {
      teamId: seedIds.teams.summerMain,
      songId: seedIds.songs.first,
    },
    create: {
      id: seedIds.teamSongs.summerFirst,
      teamId: seedIds.teams.summerMain,
      songId: seedIds.songs.first,
    },
  });

  await prisma.teamSong.upsert({
    where: { id: seedIds.teamSongs.summerSecond },
    update: {
      teamId: seedIds.teams.summerMain,
      songId: seedIds.songs.second,
    },
    create: {
      id: seedIds.teamSongs.summerSecond,
      teamId: seedIds.teams.summerMain,
      songId: seedIds.songs.second,
    },
  });

  await prisma.teamSong.upsert({
    where: { id: seedIds.teamSongs.summerThird },
    update: {
      teamId: seedIds.teams.summerMain,
      songId: seedIds.songs.third,
    },
    create: {
      id: seedIds.teamSongs.summerThird,
      teamId: seedIds.teams.summerMain,
      songId: seedIds.songs.third,
    },
  });

  await prisma.teamSong.upsert({
    where: { id: seedIds.teamSongs.acousticSecond },
    update: {
      teamId: seedIds.teams.acousticUnit,
      songId: seedIds.songs.second,
    },
    create: {
      id: seedIds.teamSongs.acousticSecond,
      teamId: seedIds.teams.acousticUnit,
      songId: seedIds.songs.second,
    },
  });
}

/**
 * 알림 목록 화면과 안읽음 개수 확인에 쓸 기본 알림 데이터를 만든다.
 *
 * @returns {Promise<void>} 알림 데이터가 준비되면 완료된다.
 */
async function upsertNotifications(): Promise<void> {
  await prisma.notification.upsert({
    where: { id: seedIds.notifications.invite },
    update: {
      userId: seedIds.users.minjun,
      type: 'INVITE',
      title: '밴드 초대가 도착했습니다.',
      description: '이서연님이 합주하자 밴드로 초대했습니다.',
      targetPath: `/invites/${seedIds.notifications.invite}`,
      isRead: false,
    },
    create: {
      id: seedIds.notifications.invite,
      userId: seedIds.users.minjun,
      type: 'INVITE',
      title: '밴드 초대가 도착했습니다.',
      description: '이서연님이 합주하자 밴드로 초대했습니다.',
      targetPath: `/invites/${seedIds.notifications.invite}`,
      isRead: false,
    },
  });

  await prisma.notification.upsert({
    where: { id: seedIds.notifications.notice },
    update: {
      userId: seedIds.users.minjun,
      type: 'NOTICE',
      title: '밴드 공지가 등록되었습니다.',
      description: '정기 공연 공지 내용을 확인해주세요.',
      targetPath: `/bands/${seedIds.band}/notices/${seedIds.notifications.notice}`,
      isRead: true,
    },
    create: {
      id: seedIds.notifications.notice,
      userId: seedIds.users.minjun,
      type: 'NOTICE',
      title: '밴드 공지가 등록되었습니다.',
      description: '정기 공연 공지 내용을 확인해주세요.',
      targetPath: `/bands/${seedIds.band}/notices/${seedIds.notifications.notice}`,
      isRead: true,
    },
  });

  await prisma.notification.upsert({
    where: { id: seedIds.notifications.reminder },
    update: {
      userId: seedIds.users.minjun,
      type: 'REMINDER',
      title: '오늘 합주 일정이 있습니다.',
      description: '오후 7시 연습실 합주 일정을 확인해주세요.',
      targetPath: `/spaces/${seedIds.spaces.acousticSession}/schedules/${seedIds.schedules.acousticPractice}`,
      isRead: false,
      remindsAt: new Date('2026-03-05T09:00:00.000Z'),
    },
    create: {
      id: seedIds.notifications.reminder,
      userId: seedIds.users.minjun,
      type: 'REMINDER',
      title: '오늘 합주 일정이 있습니다.',
      description: '오후 7시 연습실 합주 일정을 확인해주세요.',
      targetPath: `/spaces/${seedIds.spaces.acousticSession}/schedules/${seedIds.schedules.acousticPractice}`,
      isRead: false,
      remindsAt: new Date('2026-03-05T09:00:00.000Z'),
    },
  });
}

seedLocalDemoData()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error('로컬 더미 데이터 시딩에 실패했습니다.', error);
    await prisma.$disconnect();
    process.exit(1);
  });
