export interface BandNotice {
  id: string;
  content: string;
  createdAt: string; // ISO 8601
}

export interface GetBandNoticesResponse {
  items: BandNotice[];
}
