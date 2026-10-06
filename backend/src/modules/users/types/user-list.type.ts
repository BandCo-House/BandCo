import type { SkillLevelType, UserStatus } from 'src/generated/prisma';

export interface UserSkillItem {
  skillTypeId: string;
  skillName: string;
  skillLevel: SkillLevelType;
  isPrimary: boolean;
}

export interface UserListItem {
  id: string;
  nickname: string;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
  skills: UserSkillItem[];
}

export interface UserListCursor {
  createdAt: string;
  id: string;
}

export interface UserListMeta {
  count: number;
  take: number;
  cursor: UserListCursor | null;
  next: string | null;
}

export interface GetUsersResult {
  items: UserListItem[];
  meta: UserListMeta;
}
