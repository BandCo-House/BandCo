import type { ScheduleListMeta } from './schedule-list-item.type';

export interface BandScheduleListItem {
  scheduleId: string;
  spaceId: string;
  space: { spaceId: string; name: string };
  scheduleType: string;
  title: string;
  startAt: string | null;
  endAt: string | null;
  status: string;
  isMine: boolean;
}

export interface GetBandSchedulesResult {
  items: BandScheduleListItem[];
  meta: ScheduleListMeta;
}
