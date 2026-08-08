// 백엔드 GET /bandspaces/{id}/schedules 응답 계약에 정렬한 일정 타입.
export type ScheduleType = 'PRACTICE' | 'MEETING';
export type ScheduleStatus = 'PLANNED' | 'DONE' | 'CANCELED';

export interface CreateScheduleRequest {
  title: string;
  scheduleType: ScheduleType;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  status: ScheduleStatus;
  placeId?: string;
  memo?: string;
  // 연습(PRACTICE) 전용. 백엔드는 곡을 배열로 받는다(단일 선택도 [id]).
  songIds?: string[];
  teamId?: string;
  // 참가자는 userId가 아니라 bandMemberId로 보낸다.
  participantBandMemberIds?: string[];
}

// 수정(PATCH /schedules/:id)은 모든 필드 optional이며 teamId를 받지 않는다.
export type UpdateScheduleRequest = Partial<
  Omit<CreateScheduleRequest, 'teamId'>
>;

/** 생성 응답(POST). 상세 화면 진입에는 scheduleId만 필요하지만 계약대로 담아둔다. */
export interface CreateScheduleResult {
  scheduleId: string;
  spaceId: string;
  scheduleType: ScheduleType;
  title: string;
  startAt: string | null;
  endAt: string | null;
  status: ScheduleStatus;
  placeId: string | null;
  songs: ScheduleSong[];
  participantCount: number;
  teamId: string | null;
  memo: string | null;
  createdAt: string;
}

export interface ScheduleSong {
  songId: string;
  title: string;
  artistName: string;
}

/**
 * 일정 카드의 참가자 아바타 미리보기(참가자 앞쪽 일부). 전체 수는 participantCount.
 */
export interface ScheduleParticipantPreview {
  bandMemberId: string;
  nickname: string;
  profileImageUrl: string | null;
}

export interface ScheduleItem {
  scheduleId: string;
  spaceId: string;
  scheduleType: ScheduleType;
  title: string;
  startAt: string; // ISO 8601 (e.g., "2026-02-18T14:00:00+09:00")
  endAt: string;
  place: { placeId: string; name: string } | null;
  team: { teamId: string; name: string } | null;
  songs: ScheduleSong[];
  participantCount: number;
  // 참가자 아바타 미리보기(앞쪽 일부). 전체 수는 participantCount로 "+N" 표기.
  participants?: ScheduleParticipantPreview[];
  // 현재 사용자 참가 여부. "내가 포함된 일정만 보기" 필터가 이 값으로 거른다.
  // 안 내려주는 응답을 대비해 optional로 두고 사용처에서 false로 정규화한다.
  isMine?: boolean;
  memo: string | null;
  status: ScheduleStatus;
}

export interface ScheduleListCursor {
  startAt: string;
  id: string;
}

export interface ScheduleListMeta {
  count: number;
  take: number;
  cursor: ScheduleListCursor | null;
  next: string | null;
}

export interface GetSchedulesResponse {
  items: ScheduleItem[];
  meta: ScheduleListMeta;
}

/** 일정 상세(GET /schedules/:id)의 참여자. note는 악기/지참사항 등 자유 메모. */
export interface ScheduleParticipantDetail {
  participantId: string;
  bandMemberId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  attendanceStatus: string | null;
  note: string | null;
}

/** 일정 상세(GET /schedules/:id) 응답의 schedule 본문. */
export interface ScheduleDetail {
  scheduleId: string;
  spaceId: string;
  scheduleType: ScheduleType;
  title: string;
  startAt: string | null;
  endAt: string | null;
  status: ScheduleStatus;
  place: { placeId: string; name: string; address: string } | null;
  songs: ScheduleSong[];
  participants: ScheduleParticipantDetail[];
  memo: string | null;
  createdByBandMemberId: string;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
}
