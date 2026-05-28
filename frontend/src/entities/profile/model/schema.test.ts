import { describe, expect, it } from 'vitest';
import { profileSchema } from './schema';

describe('profileSchema Zod Validation', () => {
  it('백엔드 GetUserProfileResult 규격 데이터를 성공적으로 통과시킨다', () => {
    const validData = {
      user: {
        id: 'user-001',
        email: 'test@example.com',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      profile: {
        nickname: '김민준',
        selfDescription: '기타리스트입니다',
        profileMusicUrl: 'https://example.com/song.mp3',
        avatarUrl: null,
      },
      skills: [
        { skillTypeId: 'skill-1', skillName: 'Guitar', level: 'ADVANCED', isPrimary: true },
      ],
      favoriteGenres: [
        { genreId: 'genre-1', name: 'Rock' },
      ],
    };

    const parsed = profileSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });
});
