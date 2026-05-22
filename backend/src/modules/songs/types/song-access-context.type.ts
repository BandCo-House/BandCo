export interface SongAccessMember {
  id: string;
  userId: string;
}

export interface ActiveBandWithMember {
  id: string;
  member: SongAccessMember | null;
}

export interface SongWithBandMember {
  id: string;
  bandId: string;
  member: SongAccessMember | null;
}
