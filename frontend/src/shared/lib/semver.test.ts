import { describe, expect, it } from 'vitest';
import { compareSemver, isVersionBelow } from './semver';

describe('compareSemver', () => {
  it('major·minor·patch 순서로 크기를 비교한다', () => {
    expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
    expect(compareSemver('1.2.3', '1.2.4')).toBeLessThan(0);
    expect(compareSemver('1.10.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareSemver('2.0.0', '10.0.0')).toBeLessThan(0);
  });

  it('v 접두사와 pre-release·build 접미사는 숫자 비교에 영향을 주지 않는다', () => {
    expect(compareSemver('v1.2.3', '1.2.3')).toBe(0);
    expect(compareSemver('1.2.3-beta.1', '1.2.3')).toBe(0);
    expect(compareSemver(' 1.2.3+build ', '1.2.3')).toBe(0);
  });

  it('x.y.z 형식이 아니면 null을 반환한다', () => {
    expect(compareSemver('1.2', '1.2.0')).toBeNull();
    expect(compareSemver('1.2.0', 'latest')).toBeNull();
    expect(compareSemver('', '1.0.0')).toBeNull();
  });
});

describe('isVersionBelow', () => {
  it('현재 버전이 최소 버전보다 낮을 때만 true다', () => {
    expect(isVersionBelow('1.0.0', '1.0.1')).toBe(true);
    expect(isVersionBelow('1.0.1', '1.0.1')).toBe(false);
    expect(isVersionBelow('1.1.0', '1.0.1')).toBe(false);
  });

  it('어느 쪽이든 해석할 수 없으면 막지 않도록 false다', () => {
    expect(isVersionBelow('dev', '1.0.0')).toBe(false);
    expect(isVersionBelow('1.0.0', '1.0')).toBe(false);
  });
});
