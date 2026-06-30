export interface BandSearchListItem {
  bandId: string;
  name: string;
  description: string | null;
  visibility: boolean;
  memberCount: number;
  bandMaster: {
    userId: string;
    nickname: string;
  };
  createdAt: string;
}

export interface BandSearchCursor {
  createdAt: string;
  id: string;
}

export interface SearchBandsResult {
  keyword: string | null;
  items: BandSearchListItem[];
  meta: {
    count: number;
    take: number;
    cursor: BandSearchCursor | null;
    next: string | null;
  };
}
