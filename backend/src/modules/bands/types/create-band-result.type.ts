export interface BandGenreItem {
  id: string;
  name: string;
}

export interface CreateBandInvitationSuccessItem {
  userId: string;
  invitationId: string;
}

export interface CreateBandInvitationFailedItem {
  userId: string;
  reason: string;
}

export interface CreateBandResult {
  band: {
    id: string;
    name: string;
    description: string | null;
    visibility: boolean;
    coverImgUrl: string | null;
    genres: BandGenreItem[];
    bandMasterUserId: string;
    createdAt: string;
    invitations: {
      success: CreateBandInvitationSuccessItem[];
      failed: CreateBandInvitationFailedItem[];
    };
  };
}
