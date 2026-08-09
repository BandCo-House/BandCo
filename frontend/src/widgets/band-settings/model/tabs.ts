export const BAND_SETTINGS_TABS = [
  { key: 'basic', label: '기본 설정' },
  { key: 'members', label: '멤버 권한 관리' },
  { key: 'teams', label: '팀 관리' },
] as const;

export type BandSettingsTab = (typeof BAND_SETTINGS_TABS)[number]['key'];

const TAB_KEYS = BAND_SETTINGS_TABS.map((tab) => tab.key) as readonly string[];

/** route search의 tab 값을 검증한다. 알 수 없는 값은 기본 설정으로 되돌린다. */
export const parseBandSettingsTab = (value: unknown): BandSettingsTab =>
  typeof value === 'string' && TAB_KEYS.includes(value)
    ? (value as BandSettingsTab)
    : 'basic';
