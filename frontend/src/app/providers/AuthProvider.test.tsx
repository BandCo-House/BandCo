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
});
