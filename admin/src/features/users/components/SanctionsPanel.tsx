import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { formatDateTime, kstInputToIso } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Field, Input, Textarea } from '@/shared/ui/Input';
import { ConfirmModal } from '@/shared/ui/Modal';
import { Select } from '@/shared/ui/Select';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

import { useCreateSanction, useRevokeSanction, useUserSanctions } from '../api';
import { SANCTION_REASON_MAX_LENGTH, SANCTION_TYPE_LABELS } from '../labels';
import type { CreateSanctionRequest, Sanction, SanctionType } from '../types';

const SANCTION_TYPE_OPTIONS = (
  Object.keys(SANCTION_TYPE_LABELS) as SanctionType[]
).map((type) => ({ value: type, label: SANCTION_TYPE_LABELS[type] }));

const SanctionStateBadge = ({ sanction }: { sanction: Sanction }) => {
  if (sanction.revokedAt) {
    return <Badge>철회됨</Badge>;
  }
  if (sanction.type === 'WARNING') {
    return <Badge tone="yellow">경고</Badge>;
  }
  return sanction.isActive ? (
    <Badge tone="red">정지 중</Badge>
  ) : (
    <Badge>만료</Badge>
  );
};

interface SanctionsPanelProps {
  userId: string;
  hasActiveSuspension: boolean;
}

export const SanctionsPanel = ({
  userId,
  hasActiveSuspension,
}: SanctionsPanelProps) => {
  const { data, isPending, isError } = useUserSanctions(userId);
  const createSanction = useCreateSanction(userId);
  const revokeSanction = useRevokeSanction();

  const [type, setType] = useState<SanctionType>('WARNING');
  const [reason, setReason] = useState('');
  const [endsAtInput, setEndsAtInput] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Sanction | null>(null);

  const isSuspension = type === 'SUSPENSION';
  const canSubmit =
    reason.trim().length > 0 && !(isSuspension && hasActiveSuspension);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) {
      setCreateOpen(true);
    }
  };

  const handleCreate = () => {
    const endsAt = isSuspension ? kstInputToIso(endsAtInput) : null;
    const body: CreateSanctionRequest = {
      type,
      reason: reason.trim(),
      ...(endsAt ? { endsAt } : {}),
    };
    createSanction.mutate(body, {
      onSuccess: () => {
        toast.success(`${SANCTION_TYPE_LABELS[type]} 제재를 등록했습니다.`);
        setCreateOpen(false);
        setReason('');
        setEndsAtInput('');
      },
    });
  };

  const handleRevoke = () => {
    if (!revokeTarget) {
      return;
    }
    revokeSanction.mutate(revokeTarget.sanctionId, {
      onSuccess: () => {
        toast.success('제재를 철회했습니다.');
        setRevokeTarget(null);
      },
    });
  };

  const renderList = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="제재 이력을 불러오지 못했습니다." />;
    }
    if (data.sanctions.length === 0) {
      return <EmptyState title="제재 이력이 없습니다." />;
    }

    return (
      <Table>
        <THead>
          <tr>
            <Th>종류</Th>
            <Th>상태</Th>
            <Th>사유</Th>
            <Th>등록</Th>
            <Th>종료</Th>
            <Th>철회</Th>
            <Th />
          </tr>
        </THead>
        <TBody>
          {data.sanctions.map((sanction) => (
            <Tr key={sanction.sanctionId}>
              <Td>{SANCTION_TYPE_LABELS[sanction.type]}</Td>
              <Td>
                <SanctionStateBadge sanction={sanction} />
              </Td>
              <Td className="max-w-xs whitespace-pre-line">
                {sanction.reason}
              </Td>
              <Td className="whitespace-nowrap">
                {formatDateTime(sanction.createdAt)}
                <div className="text-xs text-slate-500">
                  {sanction.createdBy.name}
                </div>
              </Td>
              <Td className="whitespace-nowrap">
                {sanction.type === 'SUSPENSION'
                  ? sanction.endsAt
                    ? formatDateTime(sanction.endsAt)
                    : '영구'
                  : '-'}
              </Td>
              <Td className="whitespace-nowrap">
                {sanction.revokedAt ? (
                  <>
                    {formatDateTime(sanction.revokedAt)}
                    <div className="text-xs text-slate-500">
                      {sanction.revokedBy?.name}
                    </div>
                  </>
                ) : (
                  '-'
                )}
              </Td>
              <Td className="text-right">
                {sanction.isActive && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRevokeTarget(sanction)}
                  >
                    철회
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <Card title="제재 등록">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="종류">
              <Select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as SanctionType)
                }
                options={SANCTION_TYPE_OPTIONS}
              />
            </Field>
            <Field
              label="종료 시각 (KST)"
              hint={
                isSuspension
                  ? '비우면 영구 정지입니다.'
                  : '경고는 종료 시각이 없습니다.'
              }
            >
              <Input
                type="datetime-local"
                value={isSuspension ? endsAtInput : ''}
                onChange={(event) => setEndsAtInput(event.target.value)}
                disabled={!isSuspension}
              />
            </Field>
          </div>
          <Field
            label="사유"
            hint={
              type === 'WARNING'
                ? '경고는 회원에게 "운영 정책 위반 경고" 알림이 함께 발송됩니다.'
                : undefined
            }
          >
            <Textarea
              rows={3}
              value={reason}
              maxLength={SANCTION_REASON_MAX_LENGTH}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          {isSuspension && hasActiveSuspension && (
            <p className="text-xs text-red-600">
              이미 이용 정지 중입니다. 기존 정지를 철회한 뒤 등록하세요.
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="danger" disabled={!canSubmit}>
              제재 등록
            </Button>
          </div>
        </form>
      </Card>

      <Card title="제재 이력" bodyClassName="p-0">
        {renderList()}
      </Card>

      <ConfirmModal
        open={createOpen}
        title="제재 등록"
        description={
          isSuspension
            ? `이 회원을 ${endsAtInput ? `${endsAtInput.replace('T', ' ')}(KST)까지` : '영구'} 이용 정지합니다. 기존 로그인도 즉시 끊깁니다.`
            : '이 회원에게 경고를 등록하고 알림을 보냅니다.'
        }
        confirmLabel="등록"
        danger
        loading={createSanction.isPending}
        onConfirm={handleCreate}
        onClose={() => setCreateOpen(false)}
      />

      <ConfirmModal
        open={revokeTarget !== null}
        title="제재 철회"
        description="이용 정지를 철회합니다. 회원은 바로 다시 로그인할 수 있습니다."
        confirmLabel="철회"
        loading={revokeSanction.isPending}
        onConfirm={handleRevoke}
        onClose={() => setRevokeTarget(null)}
      />
    </div>
  );
};
