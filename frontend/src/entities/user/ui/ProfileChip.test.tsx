import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfileChip } from './ProfileChip';

describe('ProfileChip', () => {
  it('basic일 때, 칩은 이름만 보여주고 세션은 그리지 않아야 한다', () => {
    render(<ProfileChip nickname="김민준" sessionName="보컬" />);

    expect(screen.getByText('김민준')).toBeInTheDocument();
    expect(screen.queryByText('보컬')).not.toBeInTheDocument();
  });

  it('full일 때, 칩은 이름과 세션을 함께 보여줘야 한다', () => {
    render(<ProfileChip variant="full" nickname="김민준" sessionName="보컬" />);

    expect(screen.getByText('김민준')).toBeInTheDocument();
    expect(screen.getByText('보컬')).toBeInTheDocument();
  });

  it('search이고 고유 ID가 있을 때, 칩은 이름·ID·세션을 모두 보여줘야 한다', () => {
    render(
      <ProfileChip
        variant="search"
        nickname="김민준"
        handle="NY_03ABC"
        sessionName="보컬"
      />,
    );

    expect(screen.getByText('NY_03ABC')).toBeInTheDocument();
    expect(screen.getByText('보컬')).toBeInTheDocument();
  });

  it('assigned일 때, 칩은 세션을 이름 앞에 `세션:` 꼴로 붙여야 한다', () => {
    render(
      <ProfileChip variant="assigned" nickname="김민준" sessionName="기타" />,
    );

    expect(screen.getByText('기타:')).toBeInTheDocument();
    expect(screen.getByText('김민준')).toBeInTheDocument();
  });

  it('search가 아닐 때, 고유 ID를 넘겨도 그리지 않아야 한다', () => {
    render(<ProfileChip variant="full" nickname="김민준" handle="NY_03ABC" />);

    expect(screen.queryByText('NY_03ABC')).not.toBeInTheDocument();
  });

  it('아바타 머릿글자는 접근성 트리에서 숨겨, 버튼 안에 넣어도 이름이 "김 김민준"이 되지 않아야 한다', () => {
    render(
      <button type="button">
        <ProfileChip variant="search" nickname="김민준" />
      </button>,
    );

    expect(screen.getByRole('button', { name: '김민준' })).toBeInTheDocument();
  });
});
