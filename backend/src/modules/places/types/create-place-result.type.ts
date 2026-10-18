export interface CreatePlaceResult {
  placeId: string;
  bandId: string;
  name: string;
  address: string | null;
  detailAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}
