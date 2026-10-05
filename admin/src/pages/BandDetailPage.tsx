import { useState } from 'react';
import { Link, getRouteApi } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import {
  useBand,
  useDeleteBand,
  useExpireInviteLink,
  useRestoreBand,
} from '@/features/bands/api';
import { BandMembersCard } from '@/features/bands/components/BandMembersCard';
import {
  BAND_SPACE_STATUS_LABELS,
  BAND_SPACE_TYPE_LABELS,
  getVisibilityLabel,
} from '@/features/bands/labels';
import { getUserDisplayName } from '@/features/users/labels';
import { formatDateTime, formatNumber, orDash } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card, InfoList } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { ConfirmModal } from '@/shared/ui/Modal';
import { PageHeader } from '@/shared/ui/PageHeader';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

const routeApi = getRouteApi('/_auth/bands/$bandId');

type PendingAction = 'delete' | 'restore' | 'expire-link' | null;

export const BandDetailPage = () => {
  const { bandId } = routeApi.useParams();
  const { data: band, isPending, isError } = useBand(bandId);
  const deleteBand = useDeleteBand(bandId);
  const restoreBand = useRestoreBand(bandId);
  const expireInviteLink = useExpireInviteLink(bandId);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  if (isPending) {
    return <LoadingState />;
  }
  if (isError) {
    return <EmptyState title="밴드 정보를 불러오지 못했습니다." />;
  }

  const isDeleted = band.deletedAt !== null;
  const closeModal = () => setPendingAction(null);

  const handleDelete = () =>
    deleteBand.mutate(undefined, {
      onSuccess: () => {
        toast.success('밴드를 삭제했습니다.');
        closeModal();
      },
    });

  const handleRestore = () =>
    restoreBand.mutate(undefined, {
      onSuccess: () => {
        toast.success('밴드를 복구했습니다.');
        closeModal();
      },
    });

  const handleExpireLink = () =>
    expireInviteLink.mutate(undefined, {
      onSuccess: () => {
        toast.success('초대 링크를 만료했습니다.');
        closeModal();
      },
    });

  return (
    <div>
      <Link
        to="/bands"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        밴드 목록
      </Link>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {band.name}
            {isDeleted && <Badge tone="red">삭제됨</Badge>}
          </span>
        }
        description={band.bandId}
        actions={
          isDeleted ? (
            <Button onClick={() => setPendingAction('restore')}>
              밴드 복구
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setPendingAction('delete')}>
              밴드 삭제
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card title="기본 정보">
            <div className="flex gap-5">
              {band.coverImgUrl && (
                <img
                  src={band.coverImgUrl}
                  alt="밴드 커버"
                  className="size-28 shrink-0 rounded-md object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <InfoList
                  items={[
                    {
                      label: '공개 여부',
                      value: getVisibilityLabel(band.visibility),
                    },
                    {
                      label: '밴드장',
                      value: (
                        <Link
                          to="/users/$userId"
                          params={{ userId: band.bandMaster.userId }}
                          className="text-sky-700 hover:underline"
                        >
                          {getUserDisplayName(band.bandMaster)}
                        </Link>
                      ),
                    },
                    { label: '생성일', value: formatDateTime(band.createdAt) },
                    { label: '수정일', value: formatDateTime(band.updatedAt) },
                    { label: '삭제일', value: formatDateTime(band.deletedAt) },
                    {
                      label: '장르',
                      value:
                        band.genres.length === 0 ? (
                          '-'
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {band.genres.map((genre) => (
                              <Badge key={genre.genreId} tone="blue">
                                {genre.name}
                              </Badge>
                            ))}
                          </span>
                        ),
                    },
                    {
                      label: '소개',
                      value: (
                        <span className="whitespace-pre-line">
                          {orDash(band.description)}
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="콘텐츠">
              <InfoList
                items={[
                  { label: '곡', value: formatNumber(band.counts.songs) },
                  { label: '일정', value: formatNumber(band.counts.schedules) },
                  { label: '팀', value: formatNumber(band.counts.teams) },
                  { label: '장소', value: formatNumber(band.counts.places) },
                ]}
              />
            </Card>
            <Card
              title="초대 링크"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!band.inviteLink.hasActiveLink}
                  onClick={() => setPendingAction('expire-link')}
                >
                  링크 만료
                </Button>
              }
            >
              <InfoList
                columns={1}
                items={[
                  {
                    label: '상태',
                    value: band.inviteLink.hasActiveLink ? (
                      <Badge tone="green">활성</Badge>
                    ) : (
                      <Badge>없음</Badge>
                    ),
                  },
                  {
                    label: '만료 시각',
                    value: formatDateTime(band.inviteLink.expiredAt),
                  },
                ]}
              />
            </Card>
          </div>
        </div>

        <BandMembersCard band={band} />

        <Card
          title={`밴드 스페이스 (${band.bandSpaces.length})`}
          bodyClassName="p-0"
        >
          {band.bandSpaces.length === 0 ? (
            <EmptyState title="밴드 스페이스가 없습니다." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>이름</Th>
                  <Th>유형</Th>
                  <Th>상태</Th>
                  <Th className="text-right">멤버</Th>
                  <Th>생성일</Th>
                  <Th />
                </tr>
              </THead>
              <TBody>
                {band.bandSpaces.map((space) => (
                  <Tr key={space.bandSpaceId}>
                    <Td className="font-medium text-slate-900">{space.name}</Td>
                    <Td>
                      {space.spaceType
                        ? BAND_SPACE_TYPE_LABELS[space.spaceType]
                        : '-'}
                    </Td>
                    <Td>{BAND_SPACE_STATUS_LABELS[space.status]}</Td>
                    <Td className="text-right">
                      {formatNumber(space.memberCount)}
                    </Td>
                    <Td>{formatDateTime(space.createdAt)}</Td>
                    <Td>
                      {space.deletedAt && <Badge tone="red">삭제됨</Badge>}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title={`대기 중인 가입 신청 (${band.pendingJoinRequests.length})`}
            bodyClassName="p-0"
          >
            {band.pendingJoinRequests.length === 0 ? (
              <EmptyState title="대기 중인 가입 신청이 없습니다." />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>신청자</Th>
                    <Th>신청일</Th>
                  </tr>
                </THead>
                <TBody>
                  {band.pendingJoinRequests.map((request) => (
                    <Tr key={request.requestId}>
                      <Td>
                        <Link
                          to="/users/$userId"
                          params={{ userId: request.userId }}
                          className="text-sky-700 hover:underline"
                        >
                          {request.nickname ?? request.userId}
                        </Link>
                      </Td>
                      <Td>{formatDateTime(request.createdAt)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <Card
            title={`대기 중인 초대 (${band.pendingInvitations.length})`}
            bodyClassName="p-0"
          >
            {band.pendingInvitations.length === 0 ? (
              <EmptyState title="대기 중인 초대가 없습니다." />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>초대 대상</Th>
                    <Th>초대일</Th>
                  </tr>
                </THead>
                <TBody>
                  {band.pendingInvitations.map((invitation) => (
                    <Tr key={invitation.invitationId}>
                      <Td>
                        <Link
                          to="/users/$userId"
                          params={{ userId: invitation.inviteeUserId }}
                          className="text-sky-700 hover:underline"
                        >
                          {invitation.inviteeNickname ??
                            invitation.inviteeUserId}
                        </Link>
                      </Td>
                      <Td>{formatDateTime(invitation.createdAt)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={pendingAction === 'delete'}
        title="밴드 삭제"
        description={`"${band.name}" 밴드를 삭제합니다. 나중에 복구할 수 있습니다.`}
        confirmLabel="삭제"
        danger
        loading={deleteBand.isPending}
        onConfirm={handleDelete}
        onClose={closeModal}
      />
      <ConfirmModal
        open={pendingAction === 'restore'}
        title="밴드 복구"
        description={`"${band.name}" 밴드를 복구합니다.`}
        confirmLabel="복구"
        loading={restoreBand.isPending}
        onConfirm={handleRestore}
        onClose={closeModal}
      />
      <ConfirmModal
        open={pendingAction === 'expire-link'}
        title="초대 링크 만료"
        description="현재 활성화된 초대 링크를 즉시 만료합니다. 링크로 더 이상 가입할 수 없습니다."
        confirmLabel="만료"
        danger
        loading={expireInviteLink.isPending}
        onConfirm={handleExpireLink}
        onClose={closeModal}
      />
    </div>
  );
};
