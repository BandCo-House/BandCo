import type { Band } from '../model/types';

// TODO: API 명세 확정 및 백엔드 준비 후 apiGet('/bands')로 교체
export const getBands = async (): Promise<Band[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', name: '홍대 인디 밴드' },
        { id: '2', name: '직장인 연합 밴드' },
        { id: '3', name: '주말 잼 세션' },
      ]);
    }, 500); // 네트워크 지연 시뮬레이션
  });
};
