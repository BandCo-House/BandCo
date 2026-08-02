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

  // surface-1 토큰(#dce2f966)이 이미 40% 알파라 추가 투명도를 곱하지 않는다.
  if (!inviteLink) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-sm border border-grey-200 bg-surface-1 p-6 text-center">
        <p className="typo-sm-m text-grey-50">
          아직 발급된 초대 링크가 없어요.
        </p>
        <p className="typo-xs-r text-grey-200">
          링크를 발급하면 코드를 아는 사람은 누구나 &ldquo;{bandName}&rdquo;
          밴드에 참여할 수 있어요.
        </p>
        <Button
          type="button"
          variant="accent"
          className="h-[46px] px-4 typo-base-b"
          disabled={isIssuing}
          onClick={handleIssue}
        >
          {isIssuing ? '발급 중...' : '초대 링크 발급'}
        </Button>
      </div>
    );
  }

  const url = buildInviteUrl(inviteLink.inviteCode);

  return (
    <div className="flex flex-col gap-6 rounded-sm border border-grey-200 bg-surface-1 p-4">
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
          * 코드는 지금만 확인할 수 있어요. 화면을 벗어나면 다시 보려면 재발급이
          필요하고, 재발급하면 이전 링크는 즉시 무효가 됩니다.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-destructive text-destructive"
          disabled={isRevoking}
          onClick={handleRevoke}
        >
          폐기
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-primary text-primary"
          disabled={isIssuing}
          onClick={handleIssue}
        >
          재발급
        </Button>
      </div>
    </div>
  );
};
