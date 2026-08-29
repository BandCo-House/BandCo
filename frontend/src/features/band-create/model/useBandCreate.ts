import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBand } from '../api/band-api';
import type { BandCreateFormValues } from './schema';
import { bandKeys } from '@/entities/band/api/useBands';
import axios, { type AxiosError } from 'axios';

export interface UseBandCreateResult {
  submit: (
    data: BandCreateFormValues,
  ) => Promise<{ success: boolean; message?: string }>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export const useBandCreate = (): UseBandCreateResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createBand,
    onSuccess: async () => {
      // 내 밴드 목록(['bands','me'])까지 갱신하려면 all(['bands'])을 무효화해야 한다.
      // lists()(['bands','list'])는 아무도 구독하지 않는 죽은 키다.
      await queryClient.invalidateQueries({ queryKey: bandKeys.all });
    },
  });

  const submit = async (
    data: BandCreateFormValues,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await mutation.mutateAsync(data);
      return { success: true };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as
          | {
              error?: { message?: string } | null;
              message?: string;
            }
          | undefined;

        const msg =
          errorData?.error?.message ||
          errorData?.message ||
          err.message ||
          '밴드 생성에 실패했습니다.';
        return { success: false, message: msg };
      }

      if (err instanceof Error) {
        return { success: false, message: err.message };
      }

      return { success: false, message: '밴드 생성에 실패했습니다.' };
    }
  };

  const apiError = mutation.error
    ? (
        mutation.error as AxiosError<{
          error?: { message?: string } | null;
          message?: string;
        }>
      ).response?.data?.error?.message ||
      (
        mutation.error as AxiosError<{
          error?: { message?: string } | null;
          message?: string;
        }>
      ).response?.data?.message ||
      mutation.error.message
    : null;

  return {
    submit,
    isLoading: mutation.isPending,
    error: apiError,
    reset: mutation.reset,
  };
};
