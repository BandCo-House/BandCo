import { describe, expect, it } from 'vitest';
import { parseBandSettingsTab } from './tabs';

describe('parseBandSettingsTab', () => {
  it('정의된 탭 키는 그대로 통과시킨다', () => {
    expect(parseBandSettingsTab('basic')).toBe('basic');
    expect(parseBandSettingsTab('members')).toBe('members');
    expect(parseBandSettingsTab('teams')).toBe('teams');
  });

  it('알 수 없는 값은 기본 설정으로 되돌린다', () => {
    expect(parseBandSettingsTab('unknown')).toBe('basic');
    expect(parseBandSettingsTab(undefined)).toBe('basic');
    expect(parseBandSettingsTab(3)).toBe('basic');
  });
});
