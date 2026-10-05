import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/error';

// 실패 봉투의 message를 토스트로 보여준다. 화면별로 따로 처리하지 않아도 된다.
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) =>
      toast.error(getApiErrorMessage(error, '데이터를 불러오지 못했습니다.')),
  }),
  mutationCache: new MutationCache({
    onError: (error) =>
      toast.error(getApiErrorMessage(error, '요청을 처리하지 못했습니다.')),
  }),
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
