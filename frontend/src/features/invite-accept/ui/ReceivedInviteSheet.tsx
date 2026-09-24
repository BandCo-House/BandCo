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

  const { data: invitation } = useBandInvitation(inviteId, {
    enabled: Boolean(inviteId && isOpen),
  });

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
  // 실패할 경우 기본 텍스트 포맷 사용
  const parseInviteText = () => {
    const desc = noti.description;
    const inviterMatch = desc.match(/(.+?)님이/);
    const bandMatch = desc.match(/님이\s+(.+?)\s+밴드로/);

    const inviter = inviterMatch
      ? inviterMatch[1]
      : (noti.reference?.sender?.nickname ?? '누군가');
    const band = bandMatch ? bandMatch[1] : '새로운 밴드';

    return { inviter, band };
  };

  const fallback = parseInviteText();

  const inviter = invitation?.inviter.nickname ?? fallback.inviter;
  const band = invitation?.band.name ?? fallback.band;
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
