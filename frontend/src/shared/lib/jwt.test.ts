import { describe, expect, it } from 'vitest';
import { getUserIdFromToken } from './jwt';

// Mock JWT payload: {"email":"test@example.com","id":"user-001","type":"access"}
const mockToken = 'header.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6InVzZXItMDAxIiwidHlwZSI6ImFjY2VzcyJ9.signature';

describe('getUserIdFromToken', () => {
  it('토큰이 있으면 ID를 파싱하여 반환한다', () => {
    expect(getUserIdFromToken(mockToken)).toBe('user-001');
  });

  it('패딩이 유실된 Base64URL 토큰(길이 % 4 == 2)에서도 ID를 정상적으로 파싱한다', () => {
    // {"id":"usr1"} -> base64url "eyJpZCI6InVzcjEifQ" (length: 18)
    const tokenLen2 = 'header.eyJpZCI6InVzcjEifQ.signature';
    expect(getUserIdFromToken(tokenLen2)).toBe('usr1');
  });

  it('패딩이 유실된 Base64URL 토큰(길이 % 4 == 3)에서도 ID를 정상적으로 파싱한다', () => {
    // {"id":"ab"} -> base64url "eyJpZCI6ImFiIn0" (length: 15)
    const tokenLen3 = 'header.eyJpZCI6ImFiIn0.signature';
    expect(getUserIdFromToken(tokenLen3)).toBe('ab');
  });

  it('ID가 문자열이 아닌 경우 (숫자 등) null을 반환한다', () => {
    // {"id":123} -> base64 "eyJpZCI6MTIzfQ==" -> base64url "eyJpZCI6MTIzfQ"
    const tokenNonStringId = 'header.eyJpZCI6MTIzfQ.signature';
    expect(getUserIdFromToken(tokenNonStringId)).toBeNull();
  });

  it('토큰 페이로드에 ID가 없는 경우 null을 반환한다', () => {
    // {"email":"test@test.com"} -> base64url "eyJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ"
    const tokenNoId = 'header.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ.signature';
    expect(getUserIdFromToken(tokenNoId)).toBeNull();
  });

  it('토큰이 null이거나 빈 값이면 null을 반환한다', () => {
    expect(getUserIdFromToken(null)).toBeNull();
    expect(getUserIdFromToken('')).toBeNull();
  });

  it('유효하지 않은 토큰 형식이면 null을 반환한다', () => {
    expect(getUserIdFromToken('invalid-token')).toBeNull();
  });
});
