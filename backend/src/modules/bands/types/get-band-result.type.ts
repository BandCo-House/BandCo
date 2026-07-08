export interface GetBandGenreItem {
  id: string;
  name: string;
}

export interface GetBandResult {
  band: {
    id: string;
    name: string;
    description: string | null;
    visibility: boolean;
    coverImgUrl: string | null;
    bandMasterUserId: string;
    genres: GetBandGenreItem[];
    memberCount: number;
    createdAt: string;
  };
}
