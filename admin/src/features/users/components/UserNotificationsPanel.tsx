import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  NOTIFICATION_TITLE_MAX_LENGTH,
  toSendNotificationRequest,
} from '@/features/notifications/api';
import { formatDateTime, orDash } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Field, Input, Textarea } from '@/shared/ui/Input';
import { Pagination } from '@/shared/ui/Pagination';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

import {
  useResendNotification,
  useSendUserNotification,
  useUserNotifications,
} from '../api';
import { NOTIFICATION_TYPE_LABELS } from '../labels';

const EMPTY_FORM = { title: '', description: '', targetPath: '' };

interface UserNotificationsPanelProps {
  userId: string;
}

export const UserNotificationsPanel = ({
  userId,
}: UserNotificationsPanelProps) => {
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const { data, isPending, isError } = useUserNotifications(userId, { page });
  const sendNotification = useSendUserNotification(userId);
  const resendNotification = useResendNotification();

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    sendNotification.mutate(toSendNotificationRequest(form), {
      onSuccess: () => {
        toast.success('알림을 보냈습니다.');
        setForm(EMPTY_FORM);
        setPage(1);
      },
    });
  };

  const handleResend = (notificationId: string) => {
    resendNotification.mutate(notificationId, {
      onSuccess: () => toast.success('같은 내용으로 새 알림을 보냈습니다.'),
    });
  };

  const renderList = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="알림을 불러오지 못했습니다." />;
    }
    if (data.items.length === 0) {
      return <EmptyState title="받은 알림이 없습니다." />;
    }

    return (
      <>
        <Table>
          <THead>
            <tr>
              <Th>종류</Th>
              <Th>제목</Th>
              <Th>이동 경로</Th>
              <Th>읽음</Th>
              <Th>발송 시각</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {data.items.map((notification) => (
              <Tr key={notification.notificationId}>
                <Td>
                  <Badge>{NOTIFICATION_TYPE_LABELS[notification.type]}</Badge>
                </Td>
                <Td className="max-w-sm">
                  <div className="font-medium text-slate-900">
                    {notification.title}
                  </div>
                  {notification.description && (
                    <div className="text-xs whitespace-pre-line text-slate-500">
                      {notification.description}
                    </div>
                  )}
                </Td>
                <Td className="text-xs">{orDash(notification.targetPath)}</Td>
                <Td>{notification.isRead ? '읽음' : '안 읽음'}</Td>
                <Td className="whitespace-nowrap">
                  {formatDateTime(notification.createdAt)}
                </Td>
                <Td className="text-right">
                  {/* 초대 알림을 복제하면 처리된 초대를 가리키는 버튼이 생겨 서버가 공지만 재발송한다. */}
                  {notification.type === 'NOTICE' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResend(notification.notificationId)}
                      disabled={resendNotification.isPending}
                    >
                      재발송
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <Pagination pagination={data.pagination} onChange={setPage} />
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card title="알림 보내기" description="공지(NOTICE) 유형으로 발송됩니다.">
        <form onSubmit={handleSend} className="space-y-3">
          <Field label="제목">
            <Input
              required
              maxLength={NOTIFICATION_TITLE_MAX_LENGTH}
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </Field>
          <Field label="내용 (선택)">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="이동 경로 (선택)" hint="예: /bands">
            <Input
              value={form.targetPath}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, targetPath: event.target.value }))
              }
            />
          </Field>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!form.title.trim()}
              loading={sendNotification.isPending}
            >
              보내기
            </Button>
          </div>
        </form>
      </Card>

      <Card title="받은 알림" bodyClassName="p-0">
        {renderList()}
      </Card>
    </div>
  );
};
