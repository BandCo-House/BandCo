import { useNavigate } from '@tanstack/react-router';
import type { NotificationItem } from '@/entities/notification/model/types';
import { resolveInviteId } from '@/entities/notification/lib/resolve-invite-id';
import { useBandInvitation } from '@/entities/invite/api/useBandInvitation';
import { useBand } from '@/entities/band/api/useBand';
import { useReceivedInvite } from '../model/useReceivedInvite';
import {
  InviteSheetLayout,
  inviteSheetOutlineButtonClass,
  inviteSheetPrimaryButtonClass,
} from './InviteSheetLayout';

interface ReceivedInviteSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noti: NotificationItem;
}

export function ReceivedInviteSheet({
  isOpen,
  onOpenChange,
  noti,
}: ReceivedInviteSheetProps) {
  const navigate = useNavigate();

  const inviteId = resolveInviteId(noti);

  const { data: invitation, isError: isInvitationError } = useBandInvitation(
    inviteId,
    { enabled: Boolean(inviteId && isOpen) },
  );

  const bandId = invitation?.band.bandId ?? '';
  const { data: bandDetail } = useBand(bandId);

  const { handleAccept, handleDecline, isSubmitting } = useReceivedInvite({
    inviteId,
    notificationId: noti.notificationId,
    onSuccess: (bandId) => {
      onOpenChange(false);
      navigate({ to: `/band/${bandId}` as never });
    },
    onDeclineSuccess: () => onOpenChange(false),
  });

  // 알림 description에서 초대자 이름과 밴드명 파싱 시도
  // 예: "김민준님이 합주하자 밴드로 초대했습니다."
  //
  // 못 뽑으면 undefined로 둔다. 예전엔 '누군가'·'새로운 밴드'를 채웠는데, 그건 서버가
  // 준 값이 아니라 코드가 지어낸 문자열이라 사용자가 실제 밴드명으로 읽는다.
  // (파싱에 성공한 값은 서버가 보낸 알림 문구에서 나온 실제 이름이라 그대로 쓴다.)
  const parseInviteText = () => {
    const desc = noti.description;
    const inviterMatch = desc.match(/(.+?)님이/);
    const bandMatch = desc.match(/님이\s+(.+?)\s+밴드로/);

    return {
      inviter: inviterMatch?.[1] ?? noti.reference?.sender?.nickname,
      band: bandMatch?.[1],
    };
  };

  const fallback = parseInviteText();

  // 알림 문구에서 파싱한 값은 어디까지나 추정이다. 초대장 조회가 실패했는데 그 추정값을
  // 그대로 보여주면 사용자는 틀린 밴드 정보를 진짜로 읽는다 — 실패했으면 비워 둔다.
  const inviter =
    invitation?.inviter.nickname ??
    (isInvitationError ? undefined : fallback.inviter);
  const band =
    invitation?.band.name ?? (isInvitationError ? undefined : fallback.band);
  const bandDescription = invitation?.band.description ?? '';
  const memberCount = bandDetail?.memberCount;

  return (
    <InviteSheetLayout
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      inviter={inviter}
      band={band}
      bandDescription={bandDescription}
      memberCount={memberCount}
      entry="notification"
      errorMessage={
        isInvitationError
          ? '초대장 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
          : undefined
      }
      footer={
        noti.reference?.status === 'DECLINED' ? (
          <div className="flex h-[50px] w-full items-center justify-center rounded-[43px] border border-[#C6C6C8] bg-[rgba(39,43,34,0.05)] text-center typo-sm-sb text-grey-300 select-none">
            이미 거절한 초대장입니다
          </div>
        ) : noti.reference?.status === 'ACCEPTED' ? (
          <div className="flex h-[50px] w-full items-center justify-center rounded-[43px] border border-[#C6C6C8] bg-[rgba(39,43,34,0.05)] text-center typo-sm-sb text-grey-300 select-none">
            이미 수락한 초대장입니다
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDecline}
              className={inviteSheetOutlineButtonClass}
            >
              거절
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAccept}
              className={inviteSheetPrimaryButtonClass}
            >
              수락하고 참여하기
            </button>
          </>
        )
      }
    />
  );
}
