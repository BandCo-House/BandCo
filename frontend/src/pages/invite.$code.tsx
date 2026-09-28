import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/auth-context';
import { joinBandByInviteCode } from '@/entities/band/api/band-api';
import { bandKeys } from '@/entities/band/api/useBands';
import { getApiErrorMessage } from '@/shared/api/error';
import {
  InviteSheetLayout,
  inviteSheetFullButtonClass,
  inviteSheetOutlineButtonClass,
  inviteSheetPrimaryButtonClass,
} from '@/features/invite-accept/ui/InviteSheetLayout';

export const Route = createFileRoute('/invite/$code')({
  component: InviteJoinPage,
  staticData: {
    header: {
      title: '밴드 초대',
      showBack: false,
      heightVariant: 'lg',
    },
  },
});

/**
 * 공유된 초대 링크(`/invite/{code}`)의 랜딩 페이지. 비로그인도 볼 수 있다
 * (가드의 공개 경로 예외) — 알림의 초대장과 같은 시트(InviteSheetLayout)를 쓰고
 * 하단 버튼만 다르다: 비로그인이면 "로그인하고 가입하기" 하나, 로그인 후 복귀하면
 * 기존과 같은 거절/수락하고 참여하기.
 *
 * 초대자·밴드명은 코드만으로 조회할 API가 없어서(서버가 코드를 해시로만 저장)
 * 알림 초대장이 데이터 없을 때 쓰는 폴백('누군가'/'새로운 밴드')을 그대로 쓴다.
 */
function InviteJoinPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const { mutate: join, isPending } = useMutation({
    mutationFn: () => joinBandByInviteCode(code),
    onSuccess: async ({ bandId }) => {
      await queryClient.invalidateQueries({ queryKey: bandKeys.all });
      toast.success('밴드에 가입했어요.');
      await navigate({
        to: '/band/$bandId',
        params: { bandId },
        replace: true,
      });
    },
    onError: (error) => {
      // 만료·중복 가입·차단 사유는 백엔드 메시지가 구체적이라 그대로 보여준다.
      toast.error(
        getApiErrorMessage(
          error,
          '밴드 가입에 실패했어요. 초대 링크를 다시 확인해주세요.',
        ),
      );
    },
  });

  // 링크 초대는 수락 전 서버에 상태가 없어 거절 = 그냥 나가기다.
  // 비로그인은 어차피 보호 라우트로 못 가니 로그인으로 보낸다.
  const leave = () => {
    setIsOpen(false);
    void navigate({ to: user.isLoggedIn ? '/' : '/login' });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) leave();
    else setIsOpen(open);
  };

  const handleLoginFirst = () =>
    void navigate({
      to: '/login',
      search: { redirect: `/invite/${code}` },
    });

  return (
    <InviteSheetLayout
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      inviter="누군가"
      band="새로운 밴드"
      bandDescription=""
      memberCount={undefined}
      footer={
        user.isLoggedIn ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={leave}
              className={inviteSheetOutlineButtonClass}
            >
              거절
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => join()}
              className={inviteSheetPrimaryButtonClass}
            >
              {isPending ? '가입 중...' : '수락하고 참여하기'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleLoginFirst}
            className={inviteSheetFullButtonClass}
          >
            로그인하고 가입하기
          </button>
        )
      }
    />
  );
}
