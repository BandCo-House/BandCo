import type { WheelDate } from '@/shared/ui/wheel-date';
import { toWheelDate } from '@/shared/ui/wheel-date';
import type {
  CreateScheduleRequest,
  ScheduleDetail,
  ScheduleType,
} from '@/entities/schedule/model/types';

export type { ScheduleType } from '@/entities/schedule/model/types';

/** 합주/회의 공용 폼 상태. 합주 전용(songId·sessionSkillId)과 참여자는 유형에 따라 취사선택된다. */
export interface ScheduleFormState {
  scheduleType: ScheduleType;
  title: string;
  date: WheelDate;
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  placeId: string | null;
  /** 합주(PRACTICE) 전용. 백엔드는 배열로 받으므로 전송 시 [songId]로 감싼다. */
  songId: string | null;
  /** 합주 세션 선택(플레이 파트). 멤버 목록을 좁히는 UI 필터로만 쓰고 전송하지 않는다. */
  sessionSkillId: string | null;
  /** 합주=멤버 / 회의=참여자. 둘 다 bandMemberId 배열. */
  participantBandMemberIds: string[];
  memo: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** 기본 시작/종료 시간(오후 7시~9시). SpaceCreateModal과 동일한 기본 성향. */
export const createEmptyForm = (initialDate?: Date): ScheduleFormState => ({
  scheduleType: 'PRACTICE',
  title: '',
  date: toWheelDate(initialDate ?? new Date()),
  startTime: '19:00',
  endTime: '21:00',
  placeId: null,
  songId: null,
  sessionSkillId: null,
  participantBandMemberIds: [],
  memo: '',
});

/** WheelDate + 'HH:mm' → 로컬 시각의 ISO 문자열. */
const combineDateTime = (date: WheelDate, time: string): string => {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return new Date(
    date.year,
    date.month - 1,
    date.day,
    hour,
    minute,
    0,
    0,
  ).toISOString();
};

/**
 * 종료 시각이 시작과 같거나 이르면 다음 날로 넘어간 것으로 보고 하루를 더한다.
 * (예: 시작 오후 11시 → 종료 오전 1시면 종료를 다음 날 01:00으로 처리)
 */
const resolveEndAt = (startAt: string, rawEndAt: string): string =>
  new Date(rawEndAt).getTime() <= new Date(startAt).getTime()
    ? new Date(new Date(rawEndAt).getTime() + ONE_DAY_MS).toISOString()
    : rawEndAt;

/** 폼 상태 → 생성/수정 요청 페이로드. status는 PLANNED 고정. */
export const toScheduleRequest = (
  form: ScheduleFormState,
): CreateScheduleRequest => {
  const startAt = combineDateTime(form.date, form.startTime);
  const endAt = resolveEndAt(startAt, combineDateTime(form.date, form.endTime));
  const memo = form.memo.trim();

  return {
    title: form.title.trim(),
    scheduleType: form.scheduleType,
    startAt,
    endAt,
    status: 'PLANNED',
    placeId: form.placeId ?? undefined,
    memo: memo || undefined,
    songIds:
      form.scheduleType === 'PRACTICE' && form.songId
        ? [form.songId]
        : undefined,
    participantBandMemberIds: form.participantBandMemberIds.length
      ? form.participantBandMemberIds
      : undefined,
  };
};

/** 상세(수정 진입) → 폼 상태. 날짜/시간은 startAt/endAt에서 되돌린다. */
export const detailToForm = (detail: ScheduleDetail): ScheduleFormState => {
  const start = detail.startAt ? new Date(detail.startAt) : new Date();
  const end = detail.endAt ? new Date(detail.endAt) : new Date();
  const hhmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
      2,
      '0',
    )}`;

  return {
    scheduleType: detail.scheduleType,
    title: detail.title,
    date: toWheelDate(start),
    startTime: hhmm(start),
    endTime: hhmm(end),
    placeId: detail.place?.placeId ?? null,
    songId: detail.songs[0]?.songId ?? null,
    sessionSkillId: null,
    participantBandMemberIds: detail.participants.map((p) => p.bandMemberId),
    memo: detail.memo ?? '',
  };
};

/** 필수 항목 충족 여부. 공통(이름·장소) + 유형별(합주=곡, 회의=참여자). */
export const isFormValid = (form: ScheduleFormState): boolean => {
  if (form.title.trim().length === 0) return false;
  if (!form.placeId) return false;
  if (form.scheduleType === 'PRACTICE') return !!form.songId;
  return form.participantBandMemberIds.length > 0;
};
