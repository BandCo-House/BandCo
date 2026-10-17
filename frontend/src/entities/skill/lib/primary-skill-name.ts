type SkillLike = { skillName: string; isPrimary?: boolean };

/**
 * 대표 세션 이름. 대표로 지정한 세션이 없으면 첫 세션으로 대신한다.
 *
 * 유저 검색·밴드 멤버·팀원 응답이 저마다 다른 타입으로 skills를 내려주지만
 * 이 두 필드만 같으면 되므로 구조로만 받는다.
 */
export const calcPrimarySkillName = (
  skills: SkillLike[] | undefined,
): string | undefined =>
  (skills?.find((skill) => skill.isPrimary) ?? skills?.[0])?.skillName;

/**
 * 표시용 세션 이름들. 대표 세션을 맨 앞에 두고 `max`개까지만 돌려준다.
 * 한 줄에 다 늘어놓으면 닉네임 자리를 밀어내므로 개수를 묶는다.
 */
export const calcSkillNames = (
  skills: SkillLike[] | undefined,
  max: number,
): string[] =>
  [...(skills ?? [])]
    .sort((a, b) => Number(b.isPrimary ?? false) - Number(a.isPrimary ?? false))
    .slice(0, max)
    .map((skill) => skill.skillName);
