import type { WheelDate } from '@/shared/ui/wheel-date';
import { toWheelDate } from '@/shared/ui/wheel-date';
import type {
  CreateScheduleRequest,
  ScheduleDetail,
  ScheduleReferenceFileInput,
  ScheduleStatus,
  ScheduleType,
} from '@/entities/schedule/model/types';
import { type ReferenceFileDraft, toUploadedDraft } from './reference-files';

export type { ScheduleType } from '@/entities/schedule/model/types';

/** 합주/회의 공용 폼 상태. 합주 전용(songId)과 참여자는 유형에 따라 취사선택된다. */
export interface ScheduleFormState {
  scheduleType: ScheduleType;
  title: string;
  date: WheelDate;
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  placeId: string | null;
  /** 합주(PRACTICE) 전용. 백엔드는 배열로 받으므로 전송 시 [songId]로 감싼다. */
  songId: string | null;
  /** 참여자 bandMemberId 배열(합주·회의 공통). */
  participantBandMemberIds: string[];
  memo: string;
  /** 외부 링크(canonical URL). 합주·회의 공통. */
  externalLinks: string[];
  /** 참고자료 파일 draft. 합주 전용. local은 제출 시 업로드된다. */
  referenceFiles: ReferenceFileDraft[];
  /** 원본 상태. 생성 시 PLANNED, 수정 진입 시 detail.status를 왕복해 PATCH가 상태를 덮어쓰지 않게 한다. */
  status: ScheduleStatus;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// 시간 휠은 15분 단위라, 수정 진입 시 분을 같은 단위로 내림 정규화해 표시값과 저장값을 일치시킨다.
const MINUTE_STEP = 15;
const floorMinuteToStep = (minute: number) =>
  Math.min(45, Math.floor(minute / MINUTE_STEP) * MINUTE_STEP);

/** 기본 시작/종료 시간(오후 7시~9시). SpaceCreateModal과 동일한 기본 성향. */
export const createEmptyForm = (initialDate?: Date): ScheduleFormState => ({
  scheduleType: 'PRACTICE',
  title: '',
  date: toWheelDate(initialDate ?? new Date()),
  startTime: '19:00',
  endTime: '21:00',
  placeId: null,
  songId: null,
  participantBandMemberIds: [],
  memo: '',
  externalLinks: [],
  referenceFiles: [],
  status: 'PLANNED',
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

/**
 * 폼 상태 → 생성/수정 요청 페이로드. status는 폼이 보관한 원본 상태를 그대로 싣는다.
 * 참고자료는 업로드가 끝난 결과(`{ fileUrl, fileName }[]`)를 인자로 받는다 — 매핑은
 * 순수하게 두고, 파일 업로드(부수효과)는 호출부가 제출 직전에 처리한다.
 */
export const toScheduleRequest = (
  form: ScheduleFormState,
  referenceFiles: ScheduleReferenceFileInput[] = [],
): CreateScheduleRequest => {
  const startAt = combineDateTime(form.date, form.startTime);
  const endAt = resolveEndAt(startAt, combineDateTime(form.date, form.endTime));
  const memo = form.memo.trim();
  const isPractice = form.scheduleType === 'PRACTICE';

  return {
    title: form.title.trim(),
    scheduleType: form.scheduleType,
    startAt,
    endAt,
    status: form.status,
    placeId: form.placeId ?? undefined,
    memo: memo || undefined,
    songIds: isPractice && form.songId ? [form.songId] : undefined,
    participantBandMemberIds: form.participantBandMemberIds.length
      ? form.participantBandMemberIds
      : undefined,
    // 빈 배열도 그대로 보낸다 — 전체 교체 방식이라 "모두 삭제"를 표현해야 한다.
    externalLinks: form.externalLinks,
    // 참고자료는 합주 전용. 회의로 바꾸면 남아 있던 파일이 실리지 않게 막는다.
    referenceFiles: isPractice ? referenceFiles : [],
  };
};

/** 상세(수정 진입) → 폼 상태. 날짜/시간은 startAt/endAt에서 되돌린다. */
export const detailToForm = (detail: ScheduleDetail): ScheduleFormState => {
  const start = detail.startAt ? new Date(detail.startAt) : new Date();
  const end = detail.endAt ? new Date(detail.endAt) : new Date();
  const hhmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(
      floorMinuteToStep(d.getMinutes()),
    ).padStart(2, '0')}`;

  return {
    scheduleType: detail.scheduleType,
    title: detail.title,
    date: toWheelDate(start),
    startTime: hhmm(start),
    endTime: hhmm(end),
    placeId: detail.place?.placeId ?? null,
    songId: detail.songs[0]?.songId ?? null,
    participantBandMemberIds: detail.participants.map((p) => p.bandMemberId),
    memo: detail.memo ?? '',
    externalLinks: detail.externalLinks,
    referenceFiles: detail.referenceFiles.map(toUploadedDraft),
    status: detail.status,
  };
};

/** 필수 항목 충족 여부. 공통(이름·장소) + 유형별(합주=곡, 회의=참여자). */
export const isFormValid = (form: ScheduleFormState): boolean => {
  if (form.title.trim().length === 0) return false;
  if (!form.placeId) return false;
  // 참여자는 합주·회의 공통 필수. 합주는 곡도 필수.
  if (form.participantBandMemberIds.length === 0) return false;
  if (form.scheduleType === 'PRACTICE') return !!form.songId;
  return true;
};
