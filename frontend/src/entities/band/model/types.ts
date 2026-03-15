export interface Band {
  id: string;
  name: string;
  description: string | null;
  visibility: boolean;
  inviteCode: string;
  bmId: string;
  myRole: 'BM' | 'MEMBER';
  joinedAt: string;
  createdAt: string;
  memberCount?: number;
}
