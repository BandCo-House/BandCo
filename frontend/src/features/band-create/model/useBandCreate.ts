import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBand } from '../api/band-api';
import type { BandCreateRequest } from '../api/band-api';
import { bandKeys } from '@/entities/band/api/useBands';

export interface UseBandCreateResult {
  submit: (data: BandCreateRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useBandCreate = (): UseBandCreateResult => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createBand,
    onSuccess: async () => {
      // 밴드 생성 성공 시 밴드 목록 쿼리 무효화 (데이터 갱신 트리거)
      await queryClient.invalidateQueries({ queryKey: bandKeys.lists() });
      await navigate({ to: '/' });
    },
  });

  const submit = async (data: BandCreateRequest) => {
    mutation.mutate(data);
  };

  return {
    submit,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
};
