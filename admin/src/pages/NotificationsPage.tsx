import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { RequireSuperAdmin } from '@/features/auth/components/RequireSuperAdmin';
import {
  NOTIFICATION_TITLE_MAX_LENGTH,
  toSendNotificationRequest,
  useBroadcastNotification,
} from '@/features/notifications/api';
import { formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Field, Input, Textarea } from '@/shared/ui/Input';
import { ConfirmModal } from '@/shared/ui/Modal';
import { PageHeader } from '@/shared/ui/PageHeader';

const EMPTY_FORM = { title: '', description: '', targetPath: '' };

const BroadcastForm = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastSentCount, setLastSentCount] = useState<number | null>(null);
  const broadcast = useBroadcastNotification();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.title.trim()) {
      setConfirmOpen(true);
    }
  };

  const handleConfirm = () => {
    broadcast.mutate(toSendNotificationRequest(form), {
      onSuccess: ({ sentCount }) => {
        toast.success(`${formatNumber(sentCount)}명에게 알림을 보냈습니다.`);
        setLastSentCount(sentCount);
        setForm(EMPTY_FORM);
        setConfirmOpen(false);
      },
    });
  };

  return (
    <Card
      title="전체 알림 발송"
      description="탈퇴하지 않은 모든 회원에게 공지(NOTICE) 알림을 보냅니다. 되돌릴 수 없습니다."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </Field>
        <Field label="이동 경로 (선택)" hint="알림을 누르면 이동할 앱 경로">
          <Input
            value={form.targetPath}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, targetPath: event.target.value }))
            }
          />
        </Field>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {lastSentCount !== null &&
              `최근 발송: ${formatNumber(lastSentCount)}명`}
          </span>
          <Button type="submit" variant="danger" disabled={!form.title.trim()}>
            전체 발송
          </Button>
        </div>
      </form>

      <ConfirmModal
        open={confirmOpen}
        title="전체 알림 발송"
        description={`모든 회원에게 "${form.title.trim()}" 알림을 보냅니다.\n발송 후에는 취소할 수 없습니다.`}
        confirmLabel="발송"
        danger
        loading={broadcast.isPending}
        onConfirm={handleConfirm}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
};

export const NotificationsPage = () => (
  <div>
    <PageHeader title="알림 발송" />
    <RequireSuperAdmin>
      <BroadcastForm />
    </RequireSuperAdmin>
  </div>
);
