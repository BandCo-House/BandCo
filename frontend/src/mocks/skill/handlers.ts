import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { SkillType } from '@/entities/skill';
import { API_URL } from '../config';

// 백엔드는 `{ skills }`로 감싸 돌려준다.
const skills: SkillType[] = [
  { id: 'guitar-1', name: '일렉기타' },
  { id: 'acoustic-1', name: '통기타' },
  { id: 'bass-1', name: '베이스' },
  { id: 'drum-1', name: '드럼' },
  { id: 'percussion-1', name: '퍼커션' },
  { id: 'keyboard-1', name: '키보드' },
  { id: 'vocal-1', name: '보컬' },
];

export const skillHandlers = [
  http.get(`${API_URL}/common/skills`, () => {
    return HttpResponse.json<ApiResponse<{ skills: SkillType[] }>>({
      success: true,
      data: { skills },
    });
  }),
];
