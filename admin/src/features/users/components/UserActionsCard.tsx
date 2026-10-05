import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Field, Input } from '@/shared/ui/Input';
import { ConfirmModal } from '@/shared/ui/Modal';
import { Select } from '@/shared/ui/Select';

import { useRestoreUser, useUpdateUserStatus, useWithdrawUser } from '../api';
import { USER_STATUS_LABELS } from '../labels';
import type { AdminUserDetail, UserStatus } from '../types';

const STATUS_OPTIONS = (Object.keys(USER_STATUS_LABELS) as UserStatus[]).map(
  (status) => ({ value: status, label: USER_STATUS_LABELS[status] }),
);

export const UserActionsCard = ({ user }: { user: AdminUserDetail }) => {
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [statusReason, setStatusReason] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);

  const updateStatus = useUpdateUserStatus(user.userId);
  const withdraw = useWithdrawUser(user.userId);
  const restore = useRestoreUser(user.userId);

  const handleUpdateStatus = () => {
    updateStatus.mutate(
      { status, reason: statusReason.trim() || undefined },
      {
        onSuccess: (result) => {
          toast.success(
            `계정 상태를 ${USER_STATUS_LABELS[result.status]}(으)로 변경했습니다.`,
          );
          setStatusReason('');
        },
      },
    );
  };

  const handleWithdraw = () => {
    withdraw.mutate(
      { reason: withdrawReason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('탈퇴 처리했습니다.');
          setWithdrawOpen(false);
          setWithdrawReason('');
        },
      },
    );
  };

  const handleRestore = () => {
    restore.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(
          result.status === 'INACTIVE'
            ? '회원을 복구했습니다. 탈퇴 전 상태인 비활성으로 돌아왔습니다.'
            : '회원을 복구했습니다.',
        );
        setRestoreOpen(false);
      },
    });
  };

  return (
    <Card title="계정 관리">
      <div className="space-y-5">
        <div className="space-y-3">
          <Field label="계정 상태">
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as UserStatus)}
              options={STATUS_OPTIONS}
            />
          </Field>
          <Field label="변경 사유 (선택)">
            <Input
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
              placeholder="감사 로그에 남습니다"
            />
          </Field>
          <Button
            className="w-full"
            variant="secondary"
            onClick={handleUpdateStatus}
            disabled={status === user.status}
            loading={updateStatus.isPending}
          >
            상태 변경
          </Button>
        </div>

        <div className="border-t border-slate-100 pt-4">
          {user.isDeleted ? (
            <Button className="w-full" onClick={() => setRestoreOpen(true)}>
              탈퇴 복구
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="danger"
              onClick={() => setWithdrawOpen(true)}
            >
              탈퇴 처리
            </Button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={withdrawOpen}
        title="탈퇴 처리"
        description="이 회원을 탈퇴 처리합니다. 유저 탈퇴 API와 같이 탈퇴 시각만 기록되며, 나중에 복구할 수 있습니다."
        confirmLabel="탈퇴 처리"
        danger
        loading={withdraw.isPending}
        onConfirm={handleWithdraw}
        onClose={() => setWithdrawOpen(false)}
      >
        <Field label="사유 (선택)">
          <Input
            value={withdrawReason}
            onChange={(event) => setWithdrawReason(event.target.value)}
          />
        </Field>
      </ConfirmModal>

      <ConfirmModal
        open={restoreOpen}
        title="탈퇴 복구"
        description="이 회원의 탈퇴를 취소하고 계정을 복구합니다. 어드민이 탈퇴 처리한 회원은 탈퇴 직전 상태(활성·비활성)로 돌아옵니다."
        confirmLabel="복구"
        loading={restore.isPending}
        onConfirm={handleRestore}
        onClose={() => setRestoreOpen(false)}
      />
    </Card>
  );
};
