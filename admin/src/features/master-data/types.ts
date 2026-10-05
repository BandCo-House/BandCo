export interface Genre {
  genreId: string;
  name: string;
  sortOrder: number;
  usageCount: number;
}

export interface GenreListResult {
  genres: Genre[];
}

export interface SkillType {
  skillTypeId: string;
  name: string;
  sortOrder: number;
  usageCount: number;
}

export interface SkillTypeListResult {
  skillTypes: SkillType[];
}

export interface CreateMasterDataRequest {
  name: string;
  sortOrder?: number;
}

export interface UpdateMasterDataRequest {
  name?: string;
  sortOrder?: number;
}

export interface DeleteGenreResult {
  genreId: string;
}

export interface DeleteSkillTypeResult {
  skillTypeId: string;
}

/** 장르(genres)·세션(skill-types) 구분 */
export type MasterDataKind = 'genres' | 'skill-types';

/** 화면에서 장르·세션을 같은 표로 다루기 위한 공통 형태 */
export interface MasterDataItem {
  id: string;
  name: string;
  sortOrder: number;
  usageCount: number;
}
