export interface UpdateBandResult {
  bandId: string;
  name: string;
  description: string | null;
  visibility: boolean;
  coverImgUrl: string | null;
  updatedAt: string;
}
