import { apiGet } from '@/shared/api';
import { userSearchResponseSchema } from '../model/schema';
import type { UserSearchItem } from '../model/types';

export interface SearchUsersParams {
  /** 닉네임·고유 ID 부분 일치, 이메일은 전체 주소 일치 */
  keyword?: string;
  take?: number;
}

export const searchUsers = async (
  params?: SearchUsersParams,
): Promise<UserSearchItem[]> => {
  const queryParams: Record<string, string | number> = {};
  if (params?.keyword) {
    queryParams.where__keyword__contain = params.keyword;
  }
  if (params?.take) {
    queryParams.take = params.take;
  }

  const data = await apiGet<unknown>('/users', { params: queryParams });
  const parsed = userSearchResponseSchema.parse(data);
  return parsed.items;
};
