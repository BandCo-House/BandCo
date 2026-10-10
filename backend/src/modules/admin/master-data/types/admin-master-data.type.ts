/** 어드민 장르 목록 항목. usageCount = band_genres + favor_genres 행 수 */
export type AdminGenreItem = {
  genreId: string;
  name: string;
  sortOrder: number;
  usageCount: number;
};

/** 어드민 세션 목록 항목. usageCount = user_skills + song_skills + team_members + schedule_participants 행 수 */
export type AdminSkillTypeItem = {
  skillTypeId: string;
  name: string;
  sortOrder: number;
  usageCount: number;
};

/** 장르·세션 생성 값. sortOrder를 생략하면 Service가 맨 뒤 순서를 정한다. */
export type CreateMasterDataInput = {
  name: string;
  sortOrder?: number;
};

export type UpdateMasterDataInput = {
  name?: string;
  sortOrder?: number;
};
