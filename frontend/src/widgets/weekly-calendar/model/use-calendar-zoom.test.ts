import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCalendarZoom } from './use-calendar-zoom';

describe('useCalendarZoom', () => {
  it('초기 줌 레벨은 1이어야 한다', () => {
    const { result } = renderHook(() => useCalendarZoom());
    expect(result.current.zoomLevel).toBe(1);
  });

  it('줌 레벨 1일 때 슬롯 높이는 64여야 한다', () => {
    const { result } = renderHook(() => useCalendarZoom());
    expect(result.current.slotHeight).toBe(64);
  });

  it('줌 인을 호출하면 레벨이 증가해야 한다', () => {
    const { result } = renderHook(() => useCalendarZoom());
    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBe(2);
  });

  it('줌 아웃을 호출하면 레벨이 감소해야 한다', () => {
    const { result } = renderHook(() => useCalendarZoom());
    act(() => {
      result.current.zoomIn(); // 1 -> 2
      result.current.zoomOut(); // 2 -> 1
    });
    expect(result.current.zoomLevel).toBe(1);
  });

  it('줌 레벨은 1보다 작아질 수 없다', () => {
    const { result } = renderHook(() => useCalendarZoom());
    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.zoomLevel).toBe(1);
  });

  it('줌 레벨은 10보다 커질 수 없다', () => {
    const { result } = renderHook(() => useCalendarZoom());
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.zoomIn();
      }
    });
    expect(result.current.zoomLevel).toBe(10);
  });

  it('줌 레벨 10일 때 슬롯 높이는 768이어야 한다', () => {
    const { result } = renderHook(() => useCalendarZoom());
    act(() => {
      for (let i = 0; i < 9; i++) {
        result.current.zoomIn();
      }
    });
    expect(result.current.slotHeight).toBe(768);
  });
});
