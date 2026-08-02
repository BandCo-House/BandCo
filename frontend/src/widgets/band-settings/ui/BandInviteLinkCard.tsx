import { toast } from 'sonner';
import CopyIcon from '@/assets/icons/copy.svg?react';
import LinkIcon from '@/assets/icons/link.svg?react';
import { useBandInviteLink } from '@/entities/band/api/useBandInviteLink';

interface BandInviteLinkCardProps {
  bandId: string;
  bandName: string;
}

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label}를 복사했어요.`);
  } catch {
    toast.error(`${label}를 복사하지 못했어요.`);
  }
};

/**
 * 밴드 영구 초대 링크·코드 카드.
 * TODO: 백엔드 초대 링크 API 신설 전까지 MSW mock 응답으로 동작한다.
 */
export const BandInviteLinkCard = ({
  bandId,
  bandName,
}: BandInviteLinkCardProps) => {
  const { data, isLoading, isError } = useBandInviteLink(bandId);

  if (isLoading) {
    return (
      <p className="py-6 text-center typo-sm-r text-grey-300">
        초대 링크를 불러오는 중...
      </p>
    );
  }

  if (isError || !data) {
    return (
      <p className="py-6 text-center typo-sm-r text-grey-300">
        초대 링크를 불러오지 못했어요.
      </p>
    );
  }

  return (
    // surface-1 토큰(#dce2f966)이 이미 40% 알파라 추가 투명도를 곱하지 않는다.
    <div className="flex flex-col gap-6 rounded-sm border border-grey-200 bg-surface-1 p-4">
      <div className="flex flex-col gap-2">
        <p className="typo-sm-m text-grey-50">초대 링크</p>
        <div className="flex items-start gap-2">
          <p className="flex h-9 min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-full border-[0.667px] border-grey-200 bg-grey-50 px-3.5 py-2">
            <LinkIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate typo-xs-m text-black">{data.url}</span>
          </p>
          <button
            type="button"
            onClick={() => void copyToClipboard(data.url, '초대 링크')}
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
            <span className="typo-lg-b text-grey-50">{data.code}</span>
            <button
              type="button"
              aria-label="초대 코드 복사"
              onClick={() => void copyToClipboard(data.code, '초대 코드')}
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

      <p className="typo-xs-r text-grey-200">
        * 초대 코드와 링크는 만료되지 않으며, 언제든 사용할 수 있습니다
      </p>
    </div>
  );
};
