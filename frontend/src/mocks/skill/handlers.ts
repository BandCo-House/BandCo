import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { SkillType } from '@/entities/skill';
import { API_URL } from '../config';

export const skillHandlers = [
  http.get(`${API_URL}/common/skills`, () => {
    return HttpResponse.json<ApiResponse<SkillType[]>>({
      success: true,
      data: [
        { id: 'guitar-1', name: '일렉기타' },
        { id: 'acoustic-1', name: '통기타' },
        { id: 'bass-1', name: '베이스' },
        { id: 'drum-1', name: '드럼' },
        { id: 'keyboard-1', name: '키보드' },
        { id: 'vocal-1', name: '보컬' },
      ],
    });
  }),
];
