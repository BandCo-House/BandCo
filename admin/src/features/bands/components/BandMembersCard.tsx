import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

import {
  BAND_MEMBER_ROLE_LABELS,
  BAND_MEMBER_ROLE_TONES,
  getUserDisplayName,
} from '@/features/users/labels';
import { formatDateTime, orDash } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ConfirmModal } from '@/shared/ui/Modal';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

import { useTransferBandMaster } from '../api';
import type { AdminBandDetail, AdminBandMember } from '../types';

export const BandMembersCard = ({ band }: { band: AdminBandDetail }) => {
  const [target, setTarget] = useState<AdminBandMember | null>(null);
  const transferMaster = useTransferBandMaster(band.bandId);
  const isDeleted = band.deletedAt !== null;

  const handleTransfer = () => {
    if (!target) {
      return;
    }
    transferMaster.mutate(
      { userId: target.userId },
      {
        onSuccess: () => {
          toast.success(
            `${getUserDisplayName(target)}님을 밴드장으로 지정했습니다.`,
          );
          setTarget(null);
        },
      },
    );
  };

  return (
    <Card title={`멤버 (${band.members.length})`} bodyClassName="p-0">
      {band.members.length === 0 ? (
        <EmptyState title="멤버가 없습니다." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>닉네임</Th>
              <Th>이메일</Th>
              <Th>역할</Th>
              <Th>가입일</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {band.members.map((member) => (
              <Tr key={member.bandMemberId}>
                <Td>
                  <Link
                    to="/users/$userId"
                    params={{ userId: member.userId }}
                    className="text-sky-700 hover:underline"
                  >
                    {getUserDisplayName(member)}
                  </Link>
                </Td>
                <Td>{orDash(member.email)}</Td>
                <Td>
                  <Badge tone={BAND_MEMBER_ROLE_TONES[member.role]}>
                    {BAND_MEMBER_ROLE_LABELS[member.role]}
                  </Badge>
                </Td>
                <Td>{formatDateTime(member.joinedAt)}</Td>
                <Td className="text-right">
                  {member.role !== 'BM' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isDeleted}
                      title={isDeleted ? '삭제된 밴드입니다.' : undefined}
                      onClick={() => setTarget(member)}
                    >
                      밴드장으로 지정
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <ConfirmModal
        open={target !== null}
        title="밴드장 변경"
        description={
          target
            ? `${getUserDisplayName(target)}님을 밴드장으로 지정합니다.\n기존 밴드장(${getUserDisplayName(band.bandMaster)})은 운영진으로 바뀝니다.`
            : undefined
        }
        confirmLabel="지정"
        loading={transferMaster.isPending}
        onConfirm={handleTransfer}
        onClose={() => setTarget(null)}
      />
    </Card>
  );
};
