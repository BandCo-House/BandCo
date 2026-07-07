import { describe, expect, it } from 'vitest';
import { isPublicGuestPath } from './router-guards';
import type { ParsedLocation } from '@tanstack/react-router';

describe('isPublicGuestPath', () => {
  it('공개 경로(/login, /signup, /forgot-password)에 접근하면 true를 반환한다', () => {
    const mockLocation = {
      pathname: '/login',
      search: {},
    } as unknown as ParsedLocation;
    expect(isPublicGuestPath(mockLocation)).toBe(true);
  });

  it('비공개 경로(예: /)에 접근하면 false를 반환한다', () => {
    const mockLocation = {
      pathname: '/',
      search: {},
    } as unknown as ParsedLocation;
    expect(isPublicGuestPath(mockLocation)).toBe(false);
  });

  it('/profile 경로에 userId 파라미터가 없으면 false를 반환한다', () => {
    const mockLocation = {
      pathname: '/profile',
      search: {},
    } as unknown as ParsedLocation;
    expect(isPublicGuestPath(mockLocation)).toBe(false);
  });

  it('/profile 경로에 userId 파라미터가 유효한 값으로 존재하면 true를 반환한다', () => {
    const mockLocation = {
      pathname: '/profile',
      search: { userId: 'user-123' },
    } as unknown as ParsedLocation;
    expect(isPublicGuestPath(mockLocation)).toBe(true);
  });

  it('/profile 경로에 userId 파라미터가 있고 빈 문자열("")인 경우에도 true를 반환한다 (키 존재 기준)', () => {
    const mockLocation = {
      pathname: '/profile',
      search: { userId: '' },
    } as unknown as ParsedLocation;
    expect(isPublicGuestPath(mockLocation)).toBe(true);
  });

  it('/profile 경로에 userId 파라미터가 있고 undefined인 경우에도 true를 반환한다 (키 존재 기준)', () => {
    const mockLocation = {
      pathname: '/profile',
      search: { userId: undefined },
    } as unknown as ParsedLocation;
    expect(isPublicGuestPath(mockLocation)).toBe(true);
  });

  it('search 파라미터가 null인 경우에도 에러 없이 동작하고 false를 반환한다', () => {
    const mockLocation = {
      pathname: '/profile',
      search: null,
    } as unknown as ParsedLocation;
    expect(isPublicGuestPath(mockLocation)).toBe(false);
  });
});
