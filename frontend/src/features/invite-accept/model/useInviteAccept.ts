import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { joinBandByInviteCode } from '@/entities/band/api/band-api';
import { bandKeys } from '@/entities/band/api/useBands';

interface UseInviteAcceptOptions {
  onSuccess?: () => void;
}

/**
 * 사용자가 입력한 초대 코드로 밴드에 가입한다.
 * 받은 초대를 초대 ID로 수락하는 `acceptInvite`와는 다른 경로다
 * (코드 기반 가입은 `POST /invite-links/:code/join`만 받는다).
 */
export const useInviteAccept = ({ onSuccess }: UseInviteAcceptOptions) => {
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => joinBandByInviteCode(code.trim()),
    onSuccess: async () => {
      // 내 밴드 목록(['bands','me'])까지 갱신하려면 all(['bands'])을 무효화해야 한다.
      // lists()(['bands','list'])는 아무도 구독하지 않는 죽은 키라 새로고침되지 않는다.
      await queryClient.invalidateQueries({ queryKey: bandKeys.all });
      setCode('');
      onSuccess?.();
    },
    onError: () => {
      toast.error('밴드 가입에 실패했어요. 초대 코드를 다시 확인해주세요.');
    },
  });

  /** 다이얼로그를 닫을 때 호출한다. 실패한 코드가 남아 다음에 열면 그대로 보이던 문제. */
  const reset = () => {
    setCode('');
    mutation.reset();
  };

  return {
    code,
    setCode,
    reset,
    submit: () => mutation.mutate(),
    isLoading: mutation.isPending,
    isDisabled: code.trim().length === 0,
    error: mutation.error ? mutation.error.message : null,
  };
};
