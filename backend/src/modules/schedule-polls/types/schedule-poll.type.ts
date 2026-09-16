export interface SchedulePollVoter {
  bandMemberId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface SchedulePollOptionData {
  schedulePollOptionId: string;
  startAt: string;
  endAt: string;
  voters: SchedulePollVoter[];
}

export interface SchedulePollData {
  schedulePollId: string;
  bandSpaceId: string;
  createdByBandMemberId: string | null;
  options: SchedulePollOptionData[];
  myOptionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SchedulePollOption extends SchedulePollOptionData {
  voteCount: number;
  isRecommended: boolean;
}

export interface SchedulePollResult extends Omit<SchedulePollData, 'options'> {
  voterCount: number;
  options: SchedulePollOption[];
}

export interface SchedulePollListItem {
  schedulePollId: string;
  bandSpaceId: string;
  createdByBandMemberId: string | null;
  optionCount: number;
  voterCount: number;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetSchedulePollsResult {
  items: SchedulePollListItem[];
}

export interface DeleteSchedulePollResult {
  schedulePollId: string;
}
