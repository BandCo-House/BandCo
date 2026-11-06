import { describe, it, expect } from 'vitest';
import { API_URL } from '../config';
import { mockUsers } from './handlers';

describe('userHandlers', () => {
  it('GET /users?where__keyword__contain=김 은 닉네임으로 거른다', async () => {
    const res = await fetch(
      `${API_URL}/users?where__keyword__contain=${encodeURIComponent('김')}`,
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

  it('GET /users?where__keyword__contain 은 고유 ID도 대소문자 없이 찾는다', async () => {
    const res = await fetch(`${API_URL}/users?where__keyword__contain=ny_03`);
    const json = await res.json();
    expect(
      json.data.items.map((u: { handle: string | null }) => u.handle),
    ).toEqual(['NY_03ABC']);
  });

  it('GET /users 검색어 없을 시 전체 목록을 반환한다', async () => {
    const res = await fetch(`${API_URL}/users`);
    const json = await res.json();
    expect(json.status).toBe('success');
    expect(json.data.items.length).toBe(mockUsers.length);
  });
});
