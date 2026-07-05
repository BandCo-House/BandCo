// 백엔드 GET /bandspaces/{id}/schedules 응답 계약에 정렬한 일정 타입.
export type ScheduleType = 'PRACTICE' | 'MEETING';
export type ScheduleStatus = 'PLANNED' | 'DONE' | 'CANCELED';

export interface CreateScheduleRequest {
  title: string;
  scheduleType: ScheduleType;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  placeId?: string;
  memo?: string;
  status: ScheduleStatus;
  // 연습(PRACTICE) 전용
  songId?: string;
  teamId?: string;
  // 회의(MEETING) 전용
  participantUserIds?: string[];
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
