import { useState } from 'react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const BASE_SLOT_HEIGHT = 64;

/**
 * 줌 레벨에 따른 슬롯 높이 계산
 * 1단계: 64px (1시간)
 * 10단계: 768px (1시간, 1단계의 12배 -> 5분 단위가 약 64px)
 */
const calculateSlotHeight = (level: number) => {
  // 선형 증가 또는 단계별 매핑 가능. 
  // 여기서는 레벨에 따라 지수적 또는 배수로 증가시켜 가독성을 확보함.
  // 1: 64, 2: 96, 3: 128, 4: 192, 5: 256, 6: 320, 7: 384, 8: 512, 9: 640, 10: 768
  const mapping: Record<number, number> = {
    1: 64,
    2: 96,
    3: 128,
    4: 192,
    5: 256,
    6: 320,
    7: 384,
    8: 512,
    9: 640,
    10: 768,
  };
  return mapping[level] || BASE_SLOT_HEIGHT;
};

export const useCalendarZoom = (initialLevel = 1) => {
  const [zoomLevel, setZoomLevel] = useState(initialLevel);

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, MAX_ZOOM));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, MIN_ZOOM));
  };

  const slotHeight = calculateSlotHeight(zoomLevel);

  return {
    zoomLevel,
    slotHeight,
    zoomIn,
    zoomOut,
  };
};
