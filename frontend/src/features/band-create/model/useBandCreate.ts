import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBand } from '../api/band-api';
import type { BandCreateFormValues } from './schema';
import { bandKeys } from '@/entities/band/api/useBands';

export interface UseBandCreateResult {
  submit: (data: BandCreateFormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useBandCreate = (): UseBandCreateResult => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createBand,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bandKeys.lists() });
      await navigate({ to: '/' });
    },
  });

  const submit = async (data: BandCreateFormValues) => {
    try {
      await mutation.mutateAsync(data);
    } catch {
      return;
    }
  };

  return {
    submit,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
};
