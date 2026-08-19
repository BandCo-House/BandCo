import { useState } from 'react';
import { toast } from 'sonner';
import CopyIcon from '@/assets/icons/copy.svg?react';
import LinkIcon from '@/assets/icons/link.svg?react';
import {
  useCreateBandInviteLink,
  useRevokeBandInviteLink,
} from '@/entities/band/api/useBandInviteLink';
import type { BandInviteLink } from '@/entities/band/model/types';
import { formatDotDate } from '@/shared/lib/date';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface BandInviteLinkCardProps {
  bandId: string;
  bandName: string;
}

const buildInviteUrl = (code: string) =>
  `${window.location.origin}/invite/${code}`;

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label}를 복사했어요.`);
  } catch {
    toast.error(`${label}를 복사하지 못했어요.`);
  }
};

/** 운영자 권한이 없으면 백엔드가 403을 준다. */
const isForbidden = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  (error as { response?: { status?: number } }).response?.status === 403;

/**
 * 밴드 초대 링크·코드 카드.
 * 서버가 코드를 해시로만 저장해 재조회가 불가능하므로, 발급한 순간에만 원본을 보여준다.
 * 발급은 밴드 운영자(BM/ADMIN)만 할 수 있고 7일 뒤 만료된다.
 */
export const BandInviteLinkCard = ({
  bandId,
  bandName,
}: BandInviteLinkCardProps) => {
  const [inviteLink, setInviteLink] = useState<BandInviteLink | null>(null);
  const [isIssueConfirmOpen, setIsIssueConfirmOpen] = useState(false);
  const { mutate: issue, isPending: isIssuing } =
    useCreateBandInviteLink(bandId);
  const { mutate: revoke, isPending: isRevoking } =
    useRevokeBandInviteLink(bandId);

  const handleIssue = () => {
    issue(undefined, {
      onSuccess: (created) => {
        setInviteLink(created);
        toast.success('초대 링크를 발급했어요.');
      },
      onError: (error) => {
        toast.error(
          isForbidden(error)
            ? '초대 링크는 밴드 운영자만 발급할 수 있어요.'
            : '초대 링크를 발급하지 못했어요.',
        );
      },
    });
  };

  const handleRevoke = () => {
    revoke(undefined, {
      onSuccess: () => {
        setInviteLink(null);
        toast.success('초대 링크를 폐기했어요.');
      },
      onError: (error) => {
        toast.error(
          isForbidden(error)
            ? '초대 링크는 밴드 운영자만 폐기할 수 있어요.'
            : '초대 링크를 폐기하지 못했어요.',
        );
      },
    });
  };

  // 발급·재발급 모두 기존 링크를 무효화하므로 같은 확인 모달을 거친다.
  const issueConfirmDialog = (
    <ConfirmDialog
      open={isIssueConfirmOpen}
      onOpenChange={setIsIssueConfirmOpen}
      title="초대 링크를 발급할까요?"
      description="이미 공유한 링크가 있으면 즉시 무효가 되고, 받은 사람은 더 이상 참여할 수 없어요."
      confirmLabel="발급"
      onConfirm={() => {
        setIsIssueConfirmOpen(false);
        handleIssue();
      }}
    />
  );

  if (!inviteLink) {
    return (
      // 문장이 길어 가운데 정렬하면 줄바꿈이 어중간해진다. 발급 후 카드와 같이 좌정렬한다.
      <div className="flex flex-col gap-4 rounded-sm bg-surface-3 p-4">
        <div className="flex flex-col gap-1.5">
          <p className="typo-base-sb text-grey-50">
            아직 발급된 초대 링크가 없어요.
          </p>
          <p className="typo-sm-r text-grey-200">
            링크를 아는 사람은 누구나 &ldquo;{bandName}&rdquo; 밴드에 참여할 수
            있어요. 가장 최근에 발급한 링크로만 접속할 수 있습니다.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="accent"
            size="pill"
            className="typo-base-b"
            disabled={isIssuing}
            onClick={() => setIsIssueConfirmOpen(true)}
          >
            {isIssuing ? '발급 중...' : '초대 링크 발급'}
          </Button>
        </div>

        {issueConfirmDialog}
      </div>
    );
  }

  const url = buildInviteUrl(inviteLink.inviteCode);

  return (
    <div className="flex flex-col gap-6 rounded-sm bg-surface-3 p-4">
      <div className="flex flex-col gap-2">
        <p className="typo-sm-m text-grey-50">초대 링크</p>
        <div className="flex items-start gap-2">
          <p className="flex h-9 min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-full border-[0.667px] border-grey-200 bg-grey-50 px-3.5 py-2">
            <LinkIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate typo-xs-m text-black">{url}</span>
          </p>
          <button
            type="button"
            onClick={() => void copyToClipboard(url, '초대 링크')}
            className="flex shrink-0 items-center gap-2.5 self-stretch rounded-full bg-primary px-4 py-2 typo-sm-m text-black focus-visible:outline-2 focus-visible:outline-primary"
          >
            <CopyIcon aria-hidden="true" className="size-4" />
            복사
          </button>
        </div>
        <p className="typo-xs-r text-grey-200">
          이 링크를 받은 사람은 &ldquo;{bandName}&rdquo; 밴드에 참여할 수
          있습니다.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="typo-sm-m text-grey-100">초대 코드</p>
        <div className="flex h-27 flex-col items-center justify-center gap-2 rounded-sm border border-grey-200 bg-surface-1 px-4">
          <div className="flex items-center gap-2.5">
            <span className="typo-lg-b text-grey-50">
              {inviteLink.inviteCode}
            </span>
            <button
              type="button"
              aria-label="초대 코드 복사"
              onClick={() =>
                void copyToClipboard(inviteLink.inviteCode, '초대 코드')
              }
              className="-m-1.5 flex items-center justify-center p-1.5 text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <CopyIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          <p className="text-center typo-xs-r text-grey-50">
            이 코드를 직접 입력하여 밴드에 참여할 수도 있습니다
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="typo-xs-r text-grey-200">
          * {formatDotDate(inviteLink.expiredAt)}까지 사용할 수 있어요.
        </p>
        <p className="typo-xs-r text-grey-200">
          * 코드는 지금만 볼 수 있어요. 다시 보려면 재발급해야 합니다.
        </p>
      </div>

      {/* 일정 생성 하단 액션바와 같은 조합: 왼쪽 아웃라인 + 오른쪽 shining. */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="pill"
          className="border-grey-50 typo-base-b text-grey-50"
          disabled={isRevoking}
          onClick={handleRevoke}
        >
          폐기
        </Button>
        <Button
          type="button"
          variant="shining"
          size="pill"
          className="typo-base-sb"
          disabled={isIssuing}
          onClick={() => setIsIssueConfirmOpen(true)}
        >
          재발급
        </Button>
      </div>

      {issueConfirmDialog}
    </div>
  );
};
