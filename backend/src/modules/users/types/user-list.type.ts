import type { UserStatus } from 'src/generated/prisma';

export interface UserListItem {
  id: string;
  email: string | null;
  nickname: string;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserListCursor {
  createdAt: string;
  id: string;
}

export interface UserListMeta {
  count: number;
  take: number;
  cursor: UserListCursor | null;
  next: UserListCursor | null;
}

export interface GetUsersResult {
  items: UserListItem[];
  meta: UserListMeta;
}
