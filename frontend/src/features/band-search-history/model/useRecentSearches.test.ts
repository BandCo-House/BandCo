import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches } from './useRecentSearches';

describe('useRecentSearches', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('검색어를 추가하면 최근 검색어 목록 상단에 반영된다', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('록밴드');
    });
    expect(result.current.searches).toEqual(['록밴드']);
  });

  it('중복 검색어 추가 시 기존 항목을 제거하고 상단으로 이동시킨다', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('록밴드');
      result.current.addSearch('인디밴드');
      result.current.addSearch('록밴드');
    });
    expect(result.current.searches).toEqual(['록밴드', '인디밴드']);
  });

  it('검색어 제거 시 해당 항목이 삭제된다', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('록밴드');
      result.current.removeSearch('록밴드');
    });
    expect(result.current.searches).toEqual([]);
  });

  it('전체 삭제 시 목록이 비워진다', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('록밴드');
      result.current.addSearch('인디밴드');
      result.current.clearAll();
    });
    expect(result.current.searches).toEqual([]);
  });
});
