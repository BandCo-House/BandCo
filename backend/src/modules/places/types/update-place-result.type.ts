export interface UpdatePlaceResult {
  placeId: string;
  bandId: string;
  name: string;
  address: string | null;
  detailAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  isActive: boolean;
  updatedAt: string;
}
