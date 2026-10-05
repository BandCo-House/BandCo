import { useState } from 'react';

const STORAGE_KEY = 'jamplay_dismissed_announcements';
// 지난 공지 id가 끝없이 쌓이지 않게 최근 것만 남긴다.
const MAX_STORED_IDS = 50;

const readDismissedIds = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
};

const writeDismissedIds = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 저장소가 막힌 환경(사생활 보호 모드 등)에서는 이번 화면에서만 숨긴다.
  }
};

/** 이 브라우저에서 닫은 공지 id 목록. 닫은 공지는 다시 표시하지 않는다. */
export const useDismissedAnnouncements = () => {
  const [dismissedIds, setDismissedIds] = useState<string[]>(readDismissedIds);

  const dismiss = (announcementId: string) => {
    if (dismissedIds.includes(announcementId)) return;
    const next = [...dismissedIds, announcementId].slice(-MAX_STORED_IDS);
    setDismissedIds(next);
    writeDismissedIds(next);
  };

  return { dismissedIds, dismiss };
};
