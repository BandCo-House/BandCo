import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComingSoon } from './coming-soon';

describe('ComingSoon', () => {
  it('message를 전달하지 않으면 기본 준비 중 문구를 노출한다', () => {
    render(<ComingSoon />);
    expect(screen.getByText('페이지를 준비 중입니다.')).toBeInTheDocument();
  });

  it('전달한 message를 그대로 노출한다', () => {
    render(<ComingSoon message="검색 기능을 준비 중입니다." />);
    expect(screen.getByText('검색 기능을 준비 중입니다.')).toBeInTheDocument();
  });
});
