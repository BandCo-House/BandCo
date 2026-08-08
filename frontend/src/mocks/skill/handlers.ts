import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';

// 백엔드는 `{ skills }`로 감싸 돌려준다.
const skills = [
  { skillTypeId: 'guitar-1', name: '일렉기타' },
  { skillTypeId: 'acoustic-1', name: '통기타' },
  { skillTypeId: 'bass-1', name: '베이스' },
  { skillTypeId: 'drum-1', name: '드럼' },
  { skillTypeId: 'percussion-1', name: '퍼커션' },
  { skillTypeId: 'keyboard-1', name: '키보드' },
  { skillTypeId: 'vocal-1', name: '보컬' },
];

export const skillHandlers = [
  http.get(`${API_URL}/common/skills`, () => {
    return HttpResponse.json({
      success: true,
      data: { skills },
    });
  }),
];
