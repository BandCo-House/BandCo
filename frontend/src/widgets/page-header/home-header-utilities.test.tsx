import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeHeaderUtilities } from './home-header-utilities';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
  };
});

describe('HomeHeaderUtilities', () => {
  it('기본 렌더에서는 검색바 없이 프로필만 렌더링한다', () => {
    render(<HomeHeaderUtilities />);

    expect(screen.getByLabelText('프로필 열기')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('밴드/사용자를 찾아보세요')).not.toBeInTheDocument();
  });

  it('showSearchBar=true이면 검색바가 렌더링된다', () => {
    render(<HomeHeaderUtilities showSearchBar />);

    const input = screen.getByPlaceholderText('밴드/사용자를 찾아보세요');
    fireEvent.change(input, { target: { value: '테스트 검색어' } });

    expect(input).toHaveValue('테스트 검색어');
    expect(screen.getByLabelText('프로필 열기')).toBeInTheDocument();
  });

  it('showProfileAvatar=false이면 프로필 아바타를 렌더링하지 않는다', () => {
    render(<HomeHeaderUtilities showProfileAvatar={false} />);

    expect(screen.queryByLabelText('프로필 열기')).not.toBeInTheDocument();
    expect(document.querySelector('.w-px')).not.toBeInTheDocument();
  });
});
