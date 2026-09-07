import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './auth-context';
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from '@/shared/lib/auth-storage';

vi.mock('@/shared/lib/auth-storage', () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

// Mock JWT payload: {"email":"test@example.com","id":"user-001","type":"access","exp":미래}
const mockToken = `header.${window.btoa(JSON.stringify({ email: 'test@example.com', id: 'user-001', type: 'access', exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, '')}.signature`;

const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="logged-in">{auth.user.isLoggedIn ? 'YES' : 'NO'}</span>
      <span data-testid="user-id">{auth.user.id || 'NULL'}</span>
    </div>
  );
};

describe('AuthProvider JWT Decoding', () => {
  it('토큰이 있으면 ID를 파싱하여 전역 컨텍스트에 주입한다', () => {
    vi.mocked(getAccessToken).mockReturnValue(mockToken);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
    expect(screen.getByTestId('user-id').textContent).toBe('user-001');
  });

  it('패딩이 유실된 Base64URL 토큰(길이 % 4 == 2)에서도 ID를 정상적으로 파싱한다', () => {
    // {"id":"usr1","exp":미래} -> btoa 변환 후 패딩(=) 유실 모의
    const base64Len2 = window
      .btoa(
        JSON.stringify({
          id: 'usr1',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      )
      .replace(/=/g, '');
    const tokenLen2 = `header.${base64Len2}.signature`;
    vi.mocked(getAccessToken).mockReturnValue(tokenLen2);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
    expect(screen.getByTestId('user-id').textContent).toBe('usr1');
  });

  it('패딩이 유실된 Base64URL 토큰(길이 % 4 == 3)에서도 ID를 정상적으로 파싱한다', () => {
    // {"id":"ab","exp":미래} -> btoa 변환 후 패딩(=) 유실 모의
    const base64Len3 = window
      .btoa(
        JSON.stringify({ id: 'ab', exp: Math.floor(Date.now() / 1000) + 3600 }),
      )
      .replace(/=/g, '');
    const tokenLen3 = `header.${base64Len3}.signature`;
    vi.mocked(getAccessToken).mockReturnValue(tokenLen3);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
    expect(screen.getByTestId('user-id').textContent).toBe('ab');
  });

  it('ID가 문자열이 아닌 경우 (숫자 등) null을 반환하고 로그인 상태를 false로 처리한다', () => {
    // {"id":123} -> base64 "eyJpZCI6MTIzfQ==" -> base64url "eyJpZCI6MTIzfQ"
    const tokenNonStringId = 'header.eyJpZCI6MTIzfQ.signature';
    vi.mocked(getAccessToken).mockReturnValue(tokenNonStringId);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('NO');
    expect(screen.getByTestId('user-id').textContent).toBe('NULL');
  });

  it('토큰 페이로드에 ID가 없는 경우 null을 반환하고 로그인 상태를 false로 처리한다', () => {
    // {"email":"test@test.com"} -> base64url "eyJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ"
    const tokenNoId = 'header.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ.signature';
    vi.mocked(getAccessToken).mockReturnValue(tokenNoId);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('NO');
    expect(screen.getByTestId('user-id').textContent).toBe('NULL');
  });
});

describe('AuthProvider Token Expiration Logic', () => {
  const mockValidToken = `header.${window.btoa(JSON.stringify({ id: 'user-001', exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
  const mockExpiredToken = `header.${window.btoa(JSON.stringify({ id: 'user-001', exp: Math.floor(Date.now() / 1000) - 3600 }))}.signature`;
  const mockValidRefreshToken = `header.${window.btoa(JSON.stringify({ id: 'user-001', type: 'refresh', exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
  const mockExpiredRefreshToken = `header.${window.btoa(JSON.stringify({ id: 'user-001', type: 'refresh', exp: Math.floor(Date.now() / 1000) - 3600 }))}.signature`;

  it('유효한 액세스 토큰이 존재하면 리프레시 토큰이 없어도 로그인 상태를 유지한다', () => {
    vi.mocked(getAccessToken).mockReturnValue(mockValidToken);
    vi.mocked(getRefreshToken).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
  });

  it('액세스 토큰이 만료되었으나 리프레시 토큰이 유효하게 존재하면 로그인 상태를 유지한다', () => {
    vi.mocked(getAccessToken).mockReturnValue(mockExpiredToken);
    vi.mocked(getRefreshToken).mockReturnValue(mockValidRefreshToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
  });

  it('액세스 토큰이 만료되었고 리프레시 토큰이 없으면 로그인 만료 처리되고 clearTokens를 실행한다', () => {
    vi.mocked(getAccessToken).mockReturnValue(mockExpiredToken);
    vi.mocked(getRefreshToken).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('logged-in').textContent).toBe('NO');
    expect(clearTokens).toHaveBeenCalled();
  });

  it('액세스 토큰이 만료되었고 리프레시 토큰도 만료되었다면 로그인 만료 처리되고 clearTokens를 실행한다', () => {
    vi.mocked(getAccessToken).mockReturnValue(mockExpiredToken);
    vi.mocked(getRefreshToken).mockReturnValue(mockExpiredRefreshToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('logged-in').textContent).toBe('NO');
    expect(clearTokens).toHaveBeenCalled();
  });

  it('액세스 토큰이 없고 만료된 리프레시 토큰만 있는 경우 clearTokens를 실행하고 비로그인 상태를 유지한다', () => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.mocked(getRefreshToken).mockReturnValue(mockExpiredRefreshToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('logged-in').textContent).toBe('NO');
    expect(clearTokens).toHaveBeenCalled();
  });
});
