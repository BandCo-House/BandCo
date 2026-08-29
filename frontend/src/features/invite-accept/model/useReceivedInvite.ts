import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { acceptInvite, type AcceptInviteResponse } from '../api/invite-api';
import { declineInvite } from '@/features/invite-decline/api/invite-api';
import { notificationQueries } from '@/entities/notification/api/useNotificationUnreadSummary';
import { bandKeys } from '@/entities/band/api/useBands';
import { useMarkNotificationAsRead } from '@/entities/notification/api/useMarkNotificationAsRead';

interface UseReceivedInviteProps {
  inviteId: string;
  notificationId?: string;
  onSuccess?: (joinedBandId: string) => void;
  onDeclineSuccess?: () => void;
}

export function useReceivedInvite({
  inviteId,
  notificationId,
  onSuccess,
  onDeclineSuccess,
}: UseReceivedInviteProps) {
  const queryClient = useQueryClient();
  const markAsReadMutation = useMarkNotificationAsRead();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvite(inviteId),
    onSuccess: async (data: AcceptInviteResponse) => {
      toast.success('초대를 수락했습니다!');
      const promises = [
        queryClient.invalidateQueries({ queryKey: notificationQueries.all }),
        queryClient.invalidateQueries({ queryKey: bandKeys.all }),
      ];
      if (notificationId) {
        promises.push(
          markAsReadMutation.mutateAsync({
            notificationId,
            type: 'INVITE',
          }),
        );
      }
      await Promise.all(promises);
      onSuccess?.(data.bandId);
    },
    onError: () => {
      toast.error('초대 수락 중 오류가 발생했습니다.');
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => declineInvite(inviteId),
    onSuccess: async () => {
      toast.success('초대를 거절했습니다.');
      // 거절은 밴드 소속·목록을 바꾸지 않으므로 밴드 쿼리는 무효화하지 않는다.
      const promises = [
        queryClient.invalidateQueries({ queryKey: notificationQueries.all }),
      ];
      if (notificationId) {
        promises.push(
          markAsReadMutation.mutateAsync({
            notificationId,
            type: 'INVITE',
          }),
        );
      }
      await Promise.all(promises);
      onDeclineSuccess?.();
    },
    onError: () => {
      toast.error('초대 거절 중 오류가 발생했습니다.');
    },
  });

  const handleAccept = async () => {
    if (!inviteId) {
      toast.error('유효하지 않은 초대 ID입니다.');
      return;
    }
    try {
      setIsSubmitting(true);
      await acceptMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!inviteId) {
      toast.error('유효하지 않은 초대 ID입니다.');
      return;
    }
    try {
      setIsSubmitting(true);
      await declineMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleAccept,
    handleDecline,
    isSubmitting,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
  };
}
