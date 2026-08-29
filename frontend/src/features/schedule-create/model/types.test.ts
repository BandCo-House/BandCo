import { describe, expect, it } from 'vitest';
import type { ScheduleDetail } from '@/entities/schedule/model/types';
import {
  createEmptyForm,
  detailToForm,
  isFormValid,
  toScheduleRequest,
  type ScheduleFormState,
} from './types';

const baseForm = (): ScheduleFormState =>
  createEmptyForm(new Date('2026-03-01T00:00:00'));

// 로컬 타임 기준 상세(분 정규화·status 왕복 검증용). startAt/endAt은 Z 없이 로컬로 해석되게 둔다.
const makeDetail = (
  overrides: Partial<ScheduleDetail> = {},
): ScheduleDetail => ({
  scheduleId: 'sch-1',
  spaceId: 'space-1',
  scheduleType: 'MEETING',
  title: '정기회의',
  startAt: '2026-03-01T14:30:00',
  endAt: '2026-03-01T15:30:00',
  status: 'PLANNED',
  place: { placeId: 'place-1', name: '연습실 A', address: '' },
  songs: [],
  participants: [
    {
      participantId: 'p1',
      bandMemberId: 'member-1',
      userId: 'user-1',
      nickname: '김민수',
      avatarUrl: null,
      attendanceStatus: null,
      note: null,
    },
  ],
  memo: '안건 조율',
  externalLinks: [],
  referenceFiles: [],
  createdByBandMemberId: 'member-1',
  isMine: true,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  ...overrides,
});

describe('toScheduleRequest', () => {
  it('합주는 songIds로 감싸고 title/memo를 trim한다', () => {
    const req = toScheduleRequest({
      ...baseForm(),
      title: '  합주 A  ',
      placeId: 'place-1',
      songId: 'band-song-1',
      participantBandMemberIds: ['member-1'],
      memo: '   ',
    });

    expect(req).toMatchObject({
      title: '합주 A',
      scheduleType: 'PRACTICE',
      status: 'PLANNED',
      placeId: 'place-1',
      songIds: ['band-song-1'],
      participantBandMemberIds: ['member-1'],
    });
    expect(req.memo).toBeUndefined();
    expect(new Date(req.endAt).getTime()).toBeGreaterThan(
      new Date(req.startAt).getTime(),
    );
  });

  it('종료 시각이 시작보다 이르면 종료를 다음 날로 넘긴다(하루 +1)', () => {
    const req = toScheduleRequest({
      ...baseForm(),
      title: '심야 합주',
      placeId: 'place-1',
      songId: 'band-song-1',
      startTime: '23:00',
      endTime: '01:00',
    });

    const start = new Date(req.startAt);
    const end = new Date(req.endAt);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
    // 시작 다음 날 01:00 → 시작과 2시간 차.
    expect((end.getTime() - start.getTime()) / (60 * 60 * 1000)).toBe(2);
  });

  it('회의는 songIds를 보내지 않고 참여자만 보낸다', () => {
    const req = toScheduleRequest({
      ...baseForm(),
      scheduleType: 'MEETING',
      title: '정기 회의',
      placeId: 'place-2',
      songId: 'band-song-1',
      participantBandMemberIds: ['member-1', 'member-2'],
    });

    expect(req.scheduleType).toBe('MEETING');
    expect(req.songIds).toBeUndefined();
    expect(req.participantBandMemberIds).toEqual(['member-1', 'member-2']);
  });

  it('외부 링크는 그대로 싣고, 업로드가 끝난 참고자료를 페이로드에 넣는다', () => {
    const req = toScheduleRequest(
      {
        ...baseForm(),
        title: '합주 A',
        placeId: 'place-1',
        songId: 'band-song-1',
        externalLinks: ['https://example.com/'],
      },
      [{ fileUrl: 'https://cdn/x.pdf', fileName: '악보.pdf' }],
    );

    expect(req.externalLinks).toEqual(['https://example.com/']);
    expect(req.referenceFiles).toEqual([
      { fileUrl: 'https://cdn/x.pdf', fileName: '악보.pdf' },
    ]);
  });

  it('회의는 참고자료를 싣지 않는다(합주 전용)', () => {
    const req = toScheduleRequest(
      {
        ...baseForm(),
        scheduleType: 'MEETING',
        title: '정기 회의',
        placeId: 'place-2',
        participantBandMemberIds: ['member-1'],
      },
      [{ fileUrl: 'https://cdn/x.pdf', fileName: '악보.pdf' }],
    );

    expect(req.referenceFiles).toEqual([]);
  });
});

describe('isFormValid', () => {
  it('합주는 이름·장소·곡·참여자가 모두 있어야 유효하다', () => {
    const form = baseForm();
    expect(isFormValid(form)).toBe(false);
    // 참여자가 없으면 곡이 있어도 무효.
    expect(
      isFormValid({ ...form, title: '합주', placeId: 'p', songId: 's' }),
    ).toBe(false);
    expect(
      isFormValid({
        ...form,
        title: '합주',
        placeId: 'p',
        songId: 's',
        participantBandMemberIds: ['member-1'],
      }),
    ).toBe(true);
  });

  it('회의는 이름·장소·참여자가 있어야 유효하다', () => {
    const form: ScheduleFormState = {
      ...baseForm(),
      scheduleType: 'MEETING',
      title: '회의',
      placeId: 'p',
    };
    expect(isFormValid(form)).toBe(false);
    expect(
      isFormValid({ ...form, participantBandMemberIds: ['member-1'] }),
    ).toBe(true);
  });
});

describe('detailToForm', () => {
  it('상세를 폼 상태로 되돌린다(참여자 bandMemberId·곡·장소)', () => {
    const detail: ScheduleDetail = {
      scheduleId: 'sch-1',
      spaceId: 'space-1',
      scheduleType: 'MEETING',
      title: '정기회의',
      startAt: '2026-03-01T14:30:00.000Z',
      endAt: '2026-03-01T15:30:00.000Z',
      status: 'PLANNED',
      place: { placeId: 'place-1', name: '연습실 A', address: '' },
      songs: [],
      participants: [
        {
          participantId: 'p1',
          bandMemberId: 'member-1',
          userId: 'user-1',
          nickname: '김민수',
          avatarUrl: null,
          attendanceStatus: null,
          note: null,
        },
      ],
      memo: '안건 조율',
      externalLinks: [],
      referenceFiles: [],
      createdByBandMemberId: 'member-1',
      isMine: true,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    };

    const form = detailToForm(detail);
    expect(form).toMatchObject({
      scheduleType: 'MEETING',
      title: '정기회의',
      placeId: 'place-1',
      participantBandMemberIds: ['member-1'],
      memo: '안건 조율',
    });
  });

  it('원본 status(CANCELED/DONE 등)를 폼에 보존하고 저장 요청에 그대로 싣는다', () => {
    const form = detailToForm(makeDetail({ status: 'CANCELED' }));
    expect(form.status).toBe('CANCELED');
    // 수정 저장 시 PLANNED로 덮어쓰지 않는다.
    expect(toScheduleRequest(form).status).toBe('CANCELED');
  });

  it('15분 단위가 아닌 분은 진입 시 내림 정규화해 표시=저장을 맞춘다', () => {
    const form = detailToForm(
      makeDetail({
        startAt: '2026-03-01T14:37:00',
        endAt: '2026-03-01T15:52:00',
      }),
    );
    expect(form.startTime).toBe('14:30');
    expect(form.endTime).toBe('15:45');
  });

  it('상세의 참고자료는 uploaded draft로, 외부 링크는 그대로 되돌린다', () => {
    const form = detailToForm(
      makeDetail({
        externalLinks: ['https://example.com/'],
        referenceFiles: [
          {
            id: 'ref-1',
            fileUrl: 'https://cdn/score.pdf',
            fileName: '악보.pdf',
            createdAt: '2026-03-01T00:00:00.000Z',
          },
        ],
      }),
    );

    expect(form.externalLinks).toEqual(['https://example.com/']);
    expect(form.referenceFiles).toEqual([
      {
        kind: 'uploaded',
        fileUrl: 'https://cdn/score.pdf',
        fileName: '악보.pdf',
      },
    ]);
  });
});
