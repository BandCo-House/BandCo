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
});

describe('isFormValid', () => {
  it('합주는 이름·장소·곡이 모두 있어야 유효하다', () => {
    const form = baseForm();
    expect(isFormValid(form)).toBe(false);
    expect(
      isFormValid({ ...form, title: '합주', placeId: 'p', songId: 's' }),
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
});
