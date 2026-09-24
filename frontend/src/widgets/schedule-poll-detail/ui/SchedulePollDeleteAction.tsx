import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/auth-context';
import { getApiErrorMessage } from '@/shared/api/error';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useBandMembers } from '@/entities/member/api/useBandMembers';
import { useSchedulePoll } from '@/entities/schedule-poll/model/queries';
import { useDeleteSchedulePoll } from '@/features/schedule-poll-delete/api/use-delete-schedule-poll';

const DELETABLE_ROLES = ['BM', 'ADMIN'];

/**
 * 투표 상세 앱바 우측의 삭제 액션(팀 상세의 '팀 삭제'와 같은 패턴).
 * 백엔드 권한 규칙(생성자 또는 리더·부리더)과 같은 조건일 때만 보인다.
 */
export const SchedulePollDeleteAction = () => {
  const {
    bandId = '',
    spaceId = '',
    pollId = '',
  } = useParams({ strict: false });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: poll } = useSchedulePoll(pollId);
  const { data: members = [] } = useBandMembers(bandId);
  const deletePoll = useDeleteSchedulePoll(spaceId, pollId);

  const me = members.find((member) => member.userId === user.id);
  const canDelete =
    poll !== undefined &&
    me !== undefined &&
    (me.bandMemberId === poll.createdByBandMemberId ||
      DELETABLE_ROLES.includes(me.role));

  if (!canDelete) return null;

  const handleDelete = () => {
    deletePoll.mutate(undefined, {
      onSuccess: () => {
        toast.success('일정 투표를 삭제했어요.');
        void navigate({
          to: '/band/$bandId/space/$spaceId/polls',
          params: { bandId, spaceId },
        });
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, '일정 투표 삭제에 실패했어요.'));
      },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        disabled={deletePoll.isPending}
        className="flex items-center gap-1.5 typo-xs-sb text-grey-300 transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>투표 삭제</span>
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="일정 투표를 삭제하시겠습니까?"
        description="후보 시간과 멤버들의 투표가 함께 삭제되며 복구할 수 없습니다."
        confirmLabel="삭제"
        onConfirm={handleDelete}
      />
    </>
  );
};
