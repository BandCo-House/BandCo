export interface AddSpaceMemberResult {
  memberId: string;
  spaceId: string;
  userId: string;
  role: 'LEADER' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
}
