import { describe, expect, it } from 'vitest';
import { calcPrimarySkillName, calcSkillNames } from './primary-skill-name';

describe('calcPrimarySkillName', () => {
  it('대표로 지정한 세션이 있을 때, 순서와 상관없이 그 세션 이름을 돌려줘야 한다', () => {
    expect(
      calcPrimarySkillName([
        { skillName: '드럼', isPrimary: false },
        { skillName: '보컬', isPrimary: true },
      ]),
    ).toBe('보컬');
  });

  it('대표 세션이 없을 때, 첫 세션 이름으로 대신해야 한다', () => {
    expect(
      calcPrimarySkillName([{ skillName: '드럼' }, { skillName: '보컬' }]),
    ).toBe('드럼');
  });

  it('세션이 없거나 응답에 skills가 빠졌을 때, undefined를 돌려줘야 한다', () => {
    expect(calcPrimarySkillName([])).toBeUndefined();
    expect(calcPrimarySkillName(undefined)).toBeUndefined();
  });
});

describe('calcSkillNames', () => {
  it('대표 세션이 뒤쪽에 있을 때, 목록은 대표를 맨 앞으로 옮기고 나머지 순서는 유지해야 한다', () => {
    expect(
      calcSkillNames(
        [
          { skillName: '드럼' },
          { skillName: '기타' },
          { skillName: '보컬', isPrimary: true },
        ],
        3,
      ),
    ).toEqual(['보컬', '드럼', '기타']);
  });

  it('세션이 max보다 많을 때, 목록은 max개까지만 돌려줘야 한다', () => {
    expect(
      calcSkillNames(
        [{ skillName: '드럼' }, { skillName: '기타' }, { skillName: '보컬' }],
        2,
      ),
    ).toEqual(['드럼', '기타']);
  });

  it('응답에 skills가 빠졌을 때, 빈 배열을 돌려줘야 한다', () => {
    expect(calcSkillNames(undefined, 3)).toEqual([]);
  });
});
