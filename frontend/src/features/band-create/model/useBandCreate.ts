import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createBand } from '../api/band-api';
import type { BandCreateRequest } from '../api/band-api';

export interface UseBandCreateResult {
  submit: (data: BandCreateRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useBandCreate = (): UseBandCreateResult => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: BandCreateRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await createBand(data);
      await navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '밴드 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, error };
};
