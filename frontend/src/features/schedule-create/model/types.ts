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

/** 세션 편성 한 칸. 세션 하나에 멤버 한 명. */
export interface ScheduleSessionAssignment {
  skillTypeId: string;
  bandMemberId: string;
}

/** 합주/회의 공용 폼 상태. 합주 전용(songId)과 참여자는 유형에 따라 취사선택된다. */
export interface ScheduleFormState {
  scheduleType: ScheduleType;
  title: string;
  /**
   * 시작과 종료는 각자 날짜를 가진다. 밤 11시에 시작해 다음 날 새벽 1시에 끝나는
   * 합주처럼 날짜가 갈릴 수 있어, 날짜 하나로는 표현하지 못한다.
   */
  startDate: WheelDate;
  startTime: string; // 'HH:mm'
  endDate: WheelDate;
  endTime: string; // 'HH:mm'
  placeId: string | null;
  /** 합주(PRACTICE) 전용. 백엔드는 배열로 받으므로 전송 시 [songId]로 감싼다. */
  songId: string | null;
  /** 참여자 bandMemberId 배열. 회의 전용 — 합주는 sessionAssignments가 참여자를 정한다. */
  participantBandMemberIds: string[];
  /**
   * 합주 전용 세션 편성. (세션, 멤버) 한 쌍이 카드 한 장이다.
   * 한 사람이 보컬·기타를 겸하면 같은 bandMemberId가 세션별로 여러 번 들어간다.
   */
  sessionAssignments: ScheduleSessionAssignment[];
  memo: string;
  /** 외부 링크(canonical URL). 합주·회의 공통. */
  externalLinks: string[];
  /** 참고자료 파일 draft. 합주 전용. local은 제출 시 업로드된다. */
  referenceFiles: ReferenceFileDraft[];
  /** 원본 상태. 생성 시 PLANNED, 수정 진입 시 detail.status를 왕복해 PATCH가 상태를 덮어쓰지 않게 한다. */
  status: ScheduleStatus;
}

// 시간 휠은 15분 단위라, 수정 진입 시 분을 같은 단위로 내림 정규화해 표시값과 저장값을 일치시킨다.
const MINUTE_STEP = 15;
const floorMinuteToStep = (minute: number) =>
  Math.min(45, Math.floor(minute / MINUTE_STEP) * MINUTE_STEP);

/** 기본 시작/종료 시간(오후 7시~9시). SpaceCreateModal과 동일한 기본 성향. */
export const createEmptyForm = (initialDate?: Date): ScheduleFormState => ({
  scheduleType: 'PRACTICE',
  title: '',
  startDate: toWheelDate(initialDate ?? new Date()),
  startTime: '19:00',
  endDate: toWheelDate(initialDate ?? new Date()),
  endTime: '21:00',
  placeId: null,
  songId: null,
  participantBandMemberIds: [],
  sessionAssignments: [],
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

/** 종료가 시작보다 뒤인지. 같거나 이르면 저장할 수 없다(백엔드도 400으로 거절한다). */
export const isEndAfterStart = (form: ScheduleFormState): boolean =>
  new Date(combineDateTime(form.endDate, form.endTime)).getTime() >
  new Date(combineDateTime(form.startDate, form.startTime)).getTime();

/**
 * 시작 날짜를 옮기면서 종료 날짜를 같은 일수만큼 함께 옮긴 패치를 만든다.
 * 시작만 옮기면 종료가 시작보다 앞서 매번 종료 휠까지 다시 돌려야 한다.
 * 일정의 길이(당일 종료·다음 날 종료)는 그대로 유지된다.
 */
export const shiftStartDate = (
  form: ScheduleFormState,
  startDate: WheelDate,
): Pick<ScheduleFormState, 'startDate' | 'endDate'> => {
  const toDate = (d: WheelDate) => new Date(d.year, d.month - 1, d.day);
  const shifted = toDate(form.endDate);
  // 일수 차이는 UTC 자정끼리 빼야 서머타임 등으로 하루가 23·25시간인 날에도 정확하다.
  const toUtcDay = (d: WheelDate) => Date.UTC(d.year, d.month - 1, d.day);
  const movedDays = Math.round(
    (toUtcDay(startDate) - toUtcDay(form.startDate)) / (24 * 60 * 60 * 1000),
  );
  shifted.setDate(shifted.getDate() + movedDays);
  return { startDate, endDate: toWheelDate(shifted) };
};

/**
 * 종료 휠에서 고른 월·일에 연도를 붙인다. 연도 휠이 없으므로 시작 연도를 따르되,
 * 월·일이 시작보다 앞서면 해를 넘긴 것으로 본다(12월 31일 시작 → 1월 1일 종료).
 */
export const resolveEndDate = (
  startDate: WheelDate,
  picked: WheelDate,
): WheelDate => {
  const wrapsYear =
    picked.month < startDate.month ||
    (picked.month === startDate.month && picked.day < startDate.day);
  return { ...picked, year: startDate.year + (wrapsYear ? 1 : 0) };
};

/**
 * 폼 상태 → 생성/수정 요청 페이로드. status는 폼이 보관한 원본 상태를 그대로 싣는다.
 * 참고자료는 업로드가 끝난 결과(`{ fileUrl, fileName }[]`)를 인자로 받는다 — 매핑은
 * 순수하게 두고, 파일 업로드(부수효과)는 호출부가 제출 직전에 처리한다.
 */
export const toScheduleRequest = (
  form: ScheduleFormState,
  referenceFiles: ScheduleReferenceFileInput[] = [],
): CreateScheduleRequest => {
  const startAt = combineDateTime(form.startDate, form.startTime);
  const endAt = combineDateTime(form.endDate, form.endTime);
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
    // 합주는 세션 편성이 참여자를 정한다. 다만 세션이 배정되지 않은 참여자도
    // 함께 실어야 한다 — participants는 전체 교체라, 빠뜨리면 시간만 고쳐도
    // 그 사람들이 조용히 일정에서 빠진다.
    participants: isPractice
      ? [
          ...form.sessionAssignments.map((assignment) => ({
            bandMemberId: assignment.bandMemberId,
            skillTypeId: assignment.skillTypeId,
          })),
          ...form.participantBandMemberIds
            .filter(
              (bandMemberId) =>
                !form.sessionAssignments.some(
                  (assignment) => assignment.bandMemberId === bandMemberId,
                ),
            )
            .map((bandMemberId) => ({ bandMemberId })),
        ]
      : form.participantBandMemberIds.map((bandMemberId) => ({ bandMemberId })),
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
    startDate: toWheelDate(start),
    startTime: hhmm(start),
    endDate: toWheelDate(end),
    endTime: hhmm(end),
    placeId: detail.place?.placeId ?? null,
    songId: detail.songs[0]?.songId ?? null,
    // 세션이 붙은 항목은 편성으로, 안 붙은 항목은 참여자로 되돌린다.
    // 겸업하는 사람은 참여자 목록에서 한 번만 세도록 중복을 제거한다.
    participantBandMemberIds: [
      ...new Set(detail.participants.map((p) => p.bandMemberId)),
    ],
    // != null — 백엔드 배포 전에는 skillType이 아예 없는(undefined) 응답이 온다.
    // !== null로 가르면 undefined가 살아남아 p.skillType!.skillTypeId에서 터진다.
    sessionAssignments: detail.participants
      .filter((p) => p.skillType != null)
      .map((p) => ({
        skillTypeId: p.skillType!.skillTypeId,
        bandMemberId: p.bandMemberId,
      })),
    memo: detail.memo ?? '',
    externalLinks: detail.externalLinks,
    referenceFiles: detail.referenceFiles.map(toUploadedDraft),
    status: detail.status,
  };
};

/** 필수 항목 충족 여부. 공통(이름·장소·시간 순서) + 유형별(합주=곡, 회의=참여자). */
export const isFormValid = (form: ScheduleFormState): boolean => {
  if (form.title.trim().length === 0) return false;
  if (!form.placeId) return false;
  if (!isEndAfterStart(form)) return false;
  // 합주는 곡과 세션 편성이, 회의는 참여자가 필수다.
  if (form.scheduleType === 'PRACTICE') {
    // 개수만 보면 같은 세션에 두 명이 실린 편성도 통과한다(팀 편성을 옮겨 왔거나
    // 상세에서 복원한 경우). 세션 하나에 한 명이 계약이라 유일성까지 본다.
    const sessionIds = form.sessionAssignments.map((a) => a.skillTypeId);
    const hasDuplicateSession = new Set(sessionIds).size !== sessionIds.length;
    return (
      !!form.songId &&
      form.sessionAssignments.length > 0 &&
      !hasDuplicateSession
    );
  }
  return form.participantBandMemberIds.length > 0;
};
