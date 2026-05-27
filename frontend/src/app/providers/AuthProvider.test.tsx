import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './auth-context';
import { getAccessToken } from '@/shared/lib/auth-storage';

vi.mock('@/shared/lib/auth-storage', () => ({
  getAccessToken: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

// Mock JWT payload: {"email":"test@example.com","id":"user-001","type":"access"}
const mockToken = 'header.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6InVzZXItMDAxIiwidHlwZSI6ImFjY2VzcyJ9.signature';

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
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
    expect(screen.getByTestId('user-id').textContent).toBe('user-001');
  });

  it('패딩이 유실된 Base64URL 토큰(길이 % 4 == 2)에서도 ID를 정상적으로 파싱한다', () => {
    // {"id":"usr1"} -> base64url "eyJpZCI6InVzcjEifQ" (length: 18)
    const tokenLen2 = 'header.eyJpZCI6InVzcjEifQ.signature';
    vi.mocked(getAccessToken).mockReturnValue(tokenLen2);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
    expect(screen.getByTestId('user-id').textContent).toBe('usr1');
  });

  it('패딩이 유실된 Base64URL 토큰(길이 % 4 == 3)에서도 ID를 정상적으로 파싱한다', () => {
    // {"id":"ab"} -> base64url "eyJpZCI6ImFiIn0" (length: 15)
    const tokenLen3 = 'header.eyJpZCI6ImFiIn0.signature';
    vi.mocked(getAccessToken).mockReturnValue(tokenLen3);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
    expect(screen.getByTestId('user-id').textContent).toBe('ab');
  });

  it('ID가 문자열이 아닌 경우 (숫자 등) null을 반환한다', () => {
    // {"id":123} -> base64 "eyJpZCI6MTIzfQ==" -> base64url "eyJpZCI6MTIzfQ"
    const tokenNonStringId = 'header.eyJpZCI6MTIzfQ.signature';
    vi.mocked(getAccessToken).mockReturnValue(tokenNonStringId);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
    expect(screen.getByTestId('user-id').textContent).toBe('NULL');
  });

  it('토큰 페이로드에 ID가 없는 경우 null을 반환한다', () => {
    // {"email":"test@test.com"} -> base64url "eyJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ"
    const tokenNoId = 'header.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ.signature';
    vi.mocked(getAccessToken).mockReturnValue(tokenNoId);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in').textContent).toBe('YES');
    expect(screen.getByTestId('user-id').textContent).toBe('NULL');
  });
});
