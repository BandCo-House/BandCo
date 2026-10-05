const SEMVER_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

type VersionParts = [number, number, number];

const parseVersion = (version: string): VersionParts | null => {
  const match = SEMVER_PATTERN.exec(version.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

/**
 * `x.y.z` 버전을 비교한다. a가 작으면 음수, 같으면 0, 크면 양수.
 * pre-release·build 접미사는 무시한다. 둘 중 하나라도 해석할 수 없으면 null.
 */
export const compareSemver = (a: string, b: string): number | null => {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return null;

  for (let index = 0; index < left.length; index += 1) {
    const diff = left[index] - right[index];
    if (diff !== 0) return diff;
  }
  return 0;
};

/**
 * 현재 버전이 최소 버전보다 낮은지 판단한다.
 * 해석할 수 없는 값이 섞이면 false — 잘못된 설정값 하나로 앱 전체를 막지 않는다.
 */
export const isVersionBelow = (current: string, minimum: string): boolean => {
  const result = compareSemver(current, minimum);
  return result !== null && result < 0;
};
