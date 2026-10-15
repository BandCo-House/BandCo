import { apiGet } from '@/shared/api';
import { userSearchResponseSchema } from '../model/schema';
import type { UserSearchItem } from '../model/types';

export interface SearchUsersParams {
  nickname?: string;
  take?: number;
}

export const searchUsers = async (
  params?: SearchUsersParams,
): Promise<UserSearchItem[]> => {
  const queryParams: Record<string, string | number> = {};
  if (params?.nickname) {
    queryParams.where__nickname__contain = params.nickname;
  }
  if (params?.take) {
    queryParams.take = params.take;
  }

  const data = await apiGet<unknown>('/users', { params: queryParams });
  const parsed = userSearchResponseSchema.parse(data);
  return parsed.items;
};
