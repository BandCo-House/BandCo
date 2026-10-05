import { useState } from 'react';
import { Megaphone, XIcon } from 'lucide-react';
import { useActiveAnnouncements } from '@/entities/announcement/api/useActiveAnnouncements';
import type { ActiveAnnouncement } from '@/entities/announcement/model/schema';
import {
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  AppDialogHeader,
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { useDismissedAnnouncements } from '../model/useDismissedAnnouncements';

/**
 * 홈 상단 서비스 공지. 제목만 한 줄로 보여주고 누르면 전체 내용을 모달로 연다.
 * 닫은 공지는 이 브라우저에서 다시 보이지 않는다. 공지가 없거나 조회에 실패하면 아무것도 그리지 않는다.
 */
export const AnnouncementBanner = () => {
  const { data: announcements } = useActiveAnnouncements();
  const { dismissedIds, dismiss } = useDismissedAnnouncements();
  // 닫히는 애니메이션 동안 내용이 비지 않도록 선택한 공지는 닫아도 유지한다.
  const [selected, setSelected] = useState<ActiveAnnouncement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const visibleAnnouncements = (announcements ?? []).filter(
    (announcement) => !dismissedIds.includes(announcement.announcementId),
  );

  if (visibleAnnouncements.length === 0) return null;

  const openAnnouncement = (announcement: ActiveAnnouncement) => {
    setSelected(announcement);
    setIsDialogOpen(true);
  };

  return (
    <section aria-label="서비스 공지">
      <ul className="flex flex-col gap-2">
        {visibleAnnouncements.map((announcement) => (
          <li
            key={announcement.announcementId}
            className="flex items-center gap-1 rounded-md bg-surface-1 pr-2"
          >
            <button
              type="button"
              onClick={() => openAnnouncement(announcement)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-3 pl-4 text-left focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Megaphone
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
              <span className="truncate typo-sm-sb text-grey-50">
                {announcement.title}
              </span>
            </button>
            <button
              type="button"
              aria-label="공지 닫기"
              onClick={() => dismiss(announcement.announcementId)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-grey-100 transition-colors hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <XIcon aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AppDialogContent size="full" className="text-grey-50">
          <AppDialogHeader>
            <DialogTitle className="min-w-0 break-words">
              {selected?.title}
            </DialogTitle>
            <AppDialogClose />
          </AppDialogHeader>
          <AppDialogBody>
            <DialogDescription className="typo-base-r break-words whitespace-pre-wrap text-grey-100">
              {selected?.content}
            </DialogDescription>
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </section>
  );
};
