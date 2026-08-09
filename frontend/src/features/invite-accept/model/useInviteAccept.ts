import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      await queryClient.invalidateQueries({ queryKey: bandKeys.lists() });
      onSuccess?.();
    },
  });

  return {
    code,
    setCode,
    submit: () => void mutation.mutateAsync(),
    isLoading: mutation.isPending,
    isDisabled: code.trim().length === 0,
    error: mutation.error ? mutation.error.message : null,
  };
};
