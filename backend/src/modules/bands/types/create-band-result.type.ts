export interface CreatedBand {
  id: string;
  name: string;
  description: string;
  visibility: boolean;
  inviteCode: string;
  bmId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBandResult {
  band: CreatedBand;
}
