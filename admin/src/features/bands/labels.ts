import type { BandSpaceStatus, BandSpaceType } from './types';

export const BAND_SPACE_TYPE_LABELS: Record<BandSpaceType, string> = {
  PERFORMANCE: '공연',
  PRACTICE: '연습',
  ONLINE: '온라인',
};

export const BAND_SPACE_STATUS_LABELS: Record<BandSpaceStatus, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
};

export const getVisibilityLabel = (visibility: boolean): string =>
  visibility ? '공개' : '비공개';
