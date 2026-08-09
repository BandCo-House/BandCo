import { X, Users } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { useNavigate } from '@tanstack/react-router';
import type { NotificationItem } from '@/entities/notification/model/types';
import { resolveInviteId } from '@/entities/notification/lib/resolve-invite-id';
import { getKoreanParticle } from '@/shared/lib/korean-particle';
import { useBandInvitation } from '@/entities/invite/api/useBandInvitation';
import { useBand } from '@/entities/band/api/useBand';
import { useReceivedInvite } from '../model/useReceivedInvite';

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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[690px] w-full max-w-[648px] flex-col rounded-t-[24px] border-t border-[#DFDFE1] bg-gradient-to-b from-[#F9F8F0] to-[#E6E9F0] p-6 shadow-[0_-3px_9px_2px_rgba(0,0,0,0.1)] outline-none"
        showCloseButton={false}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#1B1B32] transition-colors hover:bg-black/5 active:bg-black/10"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 헤더 및 타이틀 */}
        <SheetHeader className="mt-4 flex flex-col items-center gap-2 text-center">
          <SheetTitle className="font-['SUIT'] text-xl leading-7 font-semibold text-[#1B1B32]">
            밴드 초대장
          </SheetTitle>
          <div className="flex flex-col font-['SUIT'] text-[13px] leading-[18px] font-medium text-[#1B1B32]">
            <span>{inviter}님이 회원님을</span>
            <span>{band}에 초대했습니다</span>
          </div>
        </SheetHeader>

        {/* 밴드 요약 정보 카드 */}
        <div className="mt-8 flex w-full flex-col gap-2">
          <span className="text-center font-['SUIT'] text-xs font-normal text-[#9D9D9F]">
            {band}
            {getKoreanParticle(band, '은/는')} 이런 밴드에요
          </span>

          <div className="flex w-full flex-col gap-6 rounded-lg bg-white p-6 shadow-sm">
            {bandDescription && (
              <p className="border-b border-[#DFDFE1] pb-4 text-center font-['SUIT'] text-[13px] leading-[18px] font-medium text-[#555568]">
                "{bandDescription}"
              </p>
            )}

            {/* 동적 통계 요약 (멤버 수) */}
            <div className="flex w-full items-center justify-center px-6">
              <div className="flex flex-col items-center gap-1">
                <Users className="h-4 w-4 text-[#9D9D9F]" />
                <span className="font-['SUIT'] text-[20px] leading-7 font-semibold text-[#1B1B32]">
                  {memberCount != null ? memberCount : '-'}
                </span>
                <span className="font-['SUIT Variable'] text-xs font-normal text-[#9D9D9F]">
                  멤버
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 그룹 또는 처리 완료 상태 표시 */}
        <div className="mt-auto flex w-full justify-center gap-3">
          {noti.reference?.status === 'DECLINED' ? (
            <div className="flex h-[50px] w-full items-center justify-center rounded-[43px] border border-[#C6C6C8] bg-[rgba(39,43,34,0.05)] text-center text-sm font-semibold text-[#9D9D9F] select-none">
              이미 거절한 초대장입니다
            </div>
          ) : noti.reference?.status === 'ACCEPTED' ? (
            <div className="flex h-[50px] w-full items-center justify-center rounded-[43px] border border-[#C6C6C8] bg-[rgba(39,43,34,0.05)] text-center text-sm font-semibold text-[#9D9D9F] select-none">
              이미 수락한 초대장입니다
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDecline}
                className="flex h-[50px] w-0 flex-1 cursor-pointer items-center justify-center rounded-[43px] border-[1.5px] border-[#1B1B32] text-center text-sm font-semibold text-[#1B1B32] transition-colors hover:bg-black/5 active:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                거절
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleAccept}
                className="flex h-[50px] w-0 flex-[3] cursor-pointer items-center justify-center rounded-[43px] bg-[#1B1B32] text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                수락하고 참여하기
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
