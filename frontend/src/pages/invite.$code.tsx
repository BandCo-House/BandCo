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
 * 초대자·밴드명은 코드만으로 조회할 API가 아직 없다. 폴백 문자열('누군가'/'새로운 밴드')을
 * 채우면 사용자가 그걸 실제 밴드 정보로 읽으므로, 모르는 값은 넘기지 않고 시트가 해당
 * 블록을 감추게 한다.
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
      entry="link"
      // 코드로 밴드를 조회할 엔드포인트가 아직 없다. 서버는 codeHash가 unique라
      // 찾을 수는 있으니 미리보기 API가 생기면 여기에 연결한다(후속).
      // 그 전까지는 모르는 걸 지어내지 않는다 — 시트가 알아서 해당 블록을 감춘다.
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
