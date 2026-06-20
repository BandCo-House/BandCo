export interface CreatePlaceResult {
  placeId: string;
  bandId: string;
  name: string;
  address: string;
  detailAddress: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}
