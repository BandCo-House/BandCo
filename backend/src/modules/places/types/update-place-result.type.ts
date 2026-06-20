export interface UpdatePlaceResult {
  placeId: string;
  bandId: string;
  name: string;
  address: string;
  detailAddress: string | null;
  imageUrl: string | null;
  isActive: boolean;
  updatedAt: string;
}
