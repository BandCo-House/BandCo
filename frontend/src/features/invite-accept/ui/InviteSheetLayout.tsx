import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import {
  AppSheetClose,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { getKoreanParticle } from '@/shared/lib/korean-particle';

interface InviteSheetLayoutProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inviter: string;
  band: string;
  bandDescription: string;
  memberCount: number | undefined;
  /** 하단 액션 영역. 알림 초대장은 거절/수락, 링크 랜딩은 로그인 유도 등 진입 경로마다 다르다. */
  footer: ReactNode;
}

/**
 * 밴드 초대장 시트의 프레젠테이션 레이아웃.
 * 알림 초대장(ReceivedInviteSheet)과 초대 링크 랜딩(/invite/$code)이 같은 화면을
 * 공유하고 하단 버튼만 다르므로, 마크업을 여기 한 곳에 둔다.
 */
export function InviteSheetLayout({
  isOpen,
  onOpenChange,
  inviter,
  band,
  bandDescription,
  memberCount,
  footer,
}: InviteSheetLayoutProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[80dvh] w-full max-w-[648px] flex-col rounded-t-[24px] border-t border-[#DFDFE1] bg-gradient-to-b from-[#F9F8F0] to-[#E6E9F0] p-6 shadow-[0_-3px_9px_2px_rgba(0,0,0,0.1)] outline-none"
        showCloseButton={false}
      >
        <AppSheetClose
          floating
          className="text-gradient-top hover:bg-black/5 hover:text-gradient-top active:bg-black/10"
        />

        {/* 헤더 및 타이틀 */}
        <SheetHeader className="mt-4 flex flex-col items-center gap-2 p-0 text-center">
          <SheetTitle className="typo-lg-sb text-gradient-top">
            밴드 초대장
          </SheetTitle>
          <div className="flex flex-col typo-sm-sb text-gradient-top">
            <span>{inviter}님이 회원님을</span>
            <span>{band}에 초대했습니다</span>
          </div>
        </SheetHeader>

        {/* 밴드 요약 정보 카드 */}
        <div className="mt-8 flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto">
          <span className="text-center typo-xs-r text-grey-300">
            {band}
            {getKoreanParticle(band, '은/는')} 이런 밴드에요
          </span>

          <div className="flex w-full flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm">
            {bandDescription && (
              <p className="border-b border-[#DFDFE1] pb-4 text-center typo-sm-sb text-[#555568]">
                "{bandDescription}"
              </p>
            )}

            {/* 동적 통계 요약 (멤버 수) */}
            <div className="flex w-full items-center justify-center px-6">
              <div className="flex flex-col items-center gap-1">
                <Users className="h-4 w-4 text-grey-300" />
                <span className="typo-lg-sb text-gradient-top">
                  {memberCount != null ? memberCount : '-'}
                </span>
                <span className="typo-xs-r text-grey-300">멤버</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 그룹 또는 처리 완료 상태 표시 */}
        <div className="mt-6 flex w-full shrink-0 justify-center gap-3">
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  );
}
