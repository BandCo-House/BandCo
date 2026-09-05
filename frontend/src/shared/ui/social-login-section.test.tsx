import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SocialLoginSection } from './social-login-section';

describe('SocialLoginSection', () => {
  it('SNS 빠른 로그인 영역은 안내 문구와 제공자 버튼을 렌더링해야 한다', () => {
    render(<SocialLoginSection />);

    expect(
      screen.getByText('SNS 계정으로 빠르게 로그인할 수 있어요'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Naver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kakao' })).toBeInTheDocument();
  });

  it('Google 자격증명 콜백이 주어지면 비활성 Google 버튼 대신 GIS 버튼 영역을 렌더링해야 한다', () => {
    render(<SocialLoginSection onGoogleCredential={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: 'Google' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('google-login')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Naver' })).toBeDisabled();
  });
});
