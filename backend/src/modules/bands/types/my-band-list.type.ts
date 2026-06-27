import type { BandMemberRole } from '../../../generated/prisma';

export interface MyBandListItem {
  id: string;
  name: string;
  description: string | null;
  visibility: boolean;
  myRole: BandMemberRole;
  joinedAt: string;
  createdAt: string;
  memberCount: number;
}

export interface MyBandListCursor {
  createdAt: string;
  id: string;
}

export interface GetMyBandsResult {
  items: MyBandListItem[];
  meta: {
    count: number;
    take: number;
    cursor: MyBandListCursor | null;
    next: string | null;
  };
}
