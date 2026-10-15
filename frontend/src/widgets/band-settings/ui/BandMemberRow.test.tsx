import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { BandMemberRow } from './BandMemberRow';

const skill = (skillName: string, isPrimary = false) => ({
  skillTypeId: skillName,
  skillName,
  skillLevel: 'BEGINNER' as const,
  isPrimary,
});

const memberWith = (
  skills: BandMemberListItem['skills'],
): BandMemberListItem => ({
  bandMemberId: 'member-1',
  userId: 'user-1',
  nickname: '김민수',
  avatarUrl: null,
  role: 'MEMBER',
  skills,
});

describe('BandMemberRow', () => {
  it('세션이 3개를 넘을 때, 카드는 대표 세션부터 3개만 보여주고 나머지 개수를 +N으로 붙여야 한다', () => {
    render(
      <BandMemberRow
        currentRole="MEMBER"
        member={memberWith([
          skill('드럼'),
          skill('보컬', true),
          skill('기타'),
          skill('베이스'),
        ])}
      />,
    );

    expect(screen.getByText('보컬 · 드럼 · 기타 +1')).toBeInTheDocument();
  });

  it('세션이 3개 이하일 때, 카드는 전부 보여주고 +N을 붙이지 않아야 한다', () => {
    render(
      <BandMemberRow
        currentRole="MEMBER"
        member={memberWith([skill('보컬', true), skill('기타')])}
      />,
    );

    expect(screen.getByText('보컬 · 기타')).toBeInTheDocument();
  });
});
