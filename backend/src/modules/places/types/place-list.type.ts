export interface PlaceListItem {
  placeId: string;
  name: string;
  address: string;
  detailAddress: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceListCursor {
  createdAt: string;
  id: string;
}

export interface GetBandPlacesResult {
  bandId: string;
  items: PlaceListItem[];
  meta: {
    count: number;
    take: number;
    cursor: PlaceListCursor | null;
    next: string | null;
  };
}
