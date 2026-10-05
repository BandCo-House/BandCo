import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  useAnnouncements,
  useDeleteAnnouncement,
} from '@/features/announcements/api';
import { AnnouncementFormModal } from '@/features/announcements/components/AnnouncementFormModal';
import {
  ANNOUNCEMENT_STATE_LABELS,
  ANNOUNCEMENT_STATE_TONES,
  getAnnouncementState,
} from '@/features/announcements/state';
import type { Announcement } from '@/features/announcements/types';
import { formatDateTime } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { ConfirmModal } from '@/shared/ui/Modal';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Pagination } from '@/shared/ui/Pagination';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

// 작성 모달: null이면 닫힘, 'new'면 새 공지, 객체면 수정
type FormTarget = Announcement | 'new' | null;

export const AnnouncementsPage = () => {
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const { data, isPending, isError, dataUpdatedAt } = useAnnouncements({
    page,
  });
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteAnnouncement.mutate(deleteTarget.announcementId, {
      onSuccess: () => {
        toast.success('공지를 삭제했습니다.');
        setDeleteTarget(null);
      },
    });
  };

  const renderTable = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="공지 목록을 불러오지 못했습니다." />;
    }
    if (data.items.length === 0) {
      return <EmptyState title="등록된 공지가 없습니다." />;
    }

    // 게시 상태는 목록을 받아온 시각 기준으로 계산한다.
    const now = new Date(dataUpdatedAt);

    return (
      <>
        <Table>
          <THead>
            <tr>
              <Th>상태</Th>
              <Th>제목</Th>
              <Th>게시 기간</Th>
              <Th>작성자</Th>
              <Th>생성일</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {data.items.map((announcement) => {
              const state = getAnnouncementState(announcement, now);
              return (
                <Tr key={announcement.announcementId}>
                  <Td>
                    <Badge tone={ANNOUNCEMENT_STATE_TONES[state]}>
                      {ANNOUNCEMENT_STATE_LABELS[state]}
                    </Badge>
                  </Td>
                  <Td className="max-w-md">
                    <div className="font-medium text-slate-900">
                      {announcement.title}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {announcement.content}
                    </div>
                  </Td>
                  <Td className="text-xs whitespace-nowrap">
                    {announcement.startsAt
                      ? formatDateTime(announcement.startsAt)
                      : '즉시'}{' '}
                    ~{' '}
                    {announcement.endsAt
                      ? formatDateTime(announcement.endsAt)
                      : '계속'}
                  </Td>
                  <Td>{announcement.createdBy.name}</Td>
                  <Td className="whitespace-nowrap">
                    {formatDateTime(announcement.createdAt)}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setFormTarget(announcement)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(announcement)}
                      >
                        삭제
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
        <Pagination pagination={data.pagination} onChange={setPage} />
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="공지"
        description="앱에 노출되는 공지를 관리합니다. 게시 + 기간 안인 공지만 노출됩니다."
        actions={
          <Button onClick={() => setFormTarget('new')}>
            <Plus className="size-4" aria-hidden />새 공지
          </Button>
        }
      />
      <Card bodyClassName="p-0">{renderTable()}</Card>

      {formTarget && (
        <AnnouncementFormModal
          key={formTarget === 'new' ? 'new' : formTarget.announcementId}
          announcement={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="공지 삭제"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" 공지를 삭제합니다.`
            : undefined
        }
        confirmLabel="삭제"
        danger
        loading={deleteAnnouncement.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
