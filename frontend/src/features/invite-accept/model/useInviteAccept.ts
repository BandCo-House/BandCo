import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptInvite } from '../api/invite-api';
import { bandKeys } from '@/entities/band/api/useBands';

interface UseInviteAcceptOptions {
  onSuccess?: () => void;
}

export const useInviteAccept = ({ onSuccess }: UseInviteAcceptOptions) => {
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => acceptInvite(code),
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
