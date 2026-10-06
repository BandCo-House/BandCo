import { describe, it, expect } from 'vitest';
import { API_URL } from '../config';
import { mockUsers } from './handlers';

describe('userHandlers', () => {
  it('GET /users?where__nickname__contain=김 필터링이 정상 동작한다', async () => {
    const res = await fetch(
      `${API_URL}/users?where__nickname__contain=${encodeURIComponent('김')}`,
    );
    const json = await res.json();
    expect(json.status).toBe('success');
    expect(json.data.items.length).toBeGreaterThan(0);
    expect(
      json.data.items.every((u: { nickname: string }) =>
        u.nickname.includes('김'),
      ),
    ).toBe(true);
  });

  it('GET /users 검색어 없을 시 전체 목록을 반환한다', async () => {
    const res = await fetch(`${API_URL}/users`);
    const json = await res.json();
    expect(json.status).toBe('success');
    expect(json.data.items.length).toBe(mockUsers.length);
  });
});
